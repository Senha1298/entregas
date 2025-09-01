import type { Express } from "express";
import webpush from "web-push";
import { storage } from "./storage";
import { pushSubscriptions, notificationHistory, insertPushSubscriptionSchema } from "@shared/schema";
import { eq } from "drizzle-orm";

// Configurar VAPID keys para web push
webpush.setVapidDetails(
  'mailto:admin@shopeedelivery.com',
  'BEl62iUYgUivxIkv69yViEuiBIa40HI8YlbAPNiI75GkHVAaNa7uQrr-jOyqJzNH-NfJTlwEzGOHO5F9Q5JpQP8',
  'dUiMkfy_8xpvJ1q3kzWEHIuHBBcw3bwSM3rwMX_EESQ'
);

export function setupPushNotifications(app: Express) {
  
  // Salvar subscription de push notification
  app.post('/api/push-subscriptions', async (req: any, res) => {
    try {
      const validation = insertPushSubscriptionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: 'Dados inválidos', details: validation.error });
      }

      const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
      
      const data = {
        ...validation.data,
        ipAddress: clientIp.toString(),
        userAgent: req.headers['user-agent'] || '',
      };

      // Verificar se já existe uma subscription para este endpoint
      const existingSubscription = await storage.db.select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, data.endpoint))
        .limit(1);

      if (existingSubscription.length > 0) {
        // Atualizar subscription existente
        await storage.db.update(pushSubscriptions)
          .set({ 
            ...data, 
            isActive: true,
            updatedAt: new Date() 
          })
          .where(eq(pushSubscriptions.endpoint, data.endpoint));
        
        console.log('🔄 Push subscription atualizada:', data.endpoint);
      } else {
        // Criar nova subscription
        await storage.db.insert(pushSubscriptions).values(data);
        console.log('✅ Nova push subscription criada:', data.endpoint);
      }

      res.json({ success: true, message: 'Subscription salva com sucesso' });
    } catch (error) {
      console.error('❌ Erro ao salvar push subscription:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
  
  // Listar todas as subscriptions ativas
  app.get('/api/push-subscriptions', async (req: any, res) => {
    try {
      const subscriptions = await storage.db.select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.isActive, true));
      
      res.json(subscriptions);
    } catch (error) {
      console.error('❌ Erro ao buscar subscriptions:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
  
  // Enviar notification para todos os usuários
  app.post('/api/send-notification', async (req: any, res) => {
    try {
      const { title, body, icon, badge, tag, data: notificationData, requireInteraction } = req.body;
      
      if (!title || !body) {
        return res.status(400).json({ error: 'Título e corpo são obrigatórios' });
      }
      
      // Buscar todas as subscriptions ativas
      const subscriptions = await storage.db.select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.isActive, true));
      
      if (subscriptions.length === 0) {
        return res.status(400).json({ error: 'Nenhuma subscription ativa encontrada' });
      }
      
      // Preparar payload da notificação
      const payload = JSON.stringify({
        title,
        body,
        icon: icon || '/shopee-icon.jpg',
        badge: badge || '/shopee-icon.jpg',
        tag: tag || 'shopee-admin-notification',
        data: notificationData || {},
        requireInteraction: requireInteraction || false
      });
      
      console.log(`📢 Enviando notificação para ${subscriptions.length} usuários:`, payload);
      
      let successCount = 0;
      let failureCount = 0;
      
      // Enviar para cada subscription
      const promises = subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification({
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dhKey!,
              auth: subscription.authKey!
            }
          }, payload);
          
          successCount++;
          console.log(`✅ Notificação enviada com sucesso para: ${subscription.endpoint.substring(0, 50)}...`);
        } catch (error: any) {
          failureCount++;
          console.error(`❌ Erro ao enviar para ${subscription.endpoint.substring(0, 50)}...`, error.message);
          
          // Se a subscription é inválida, desativá-la
          if (error.statusCode === 410 || error.statusCode === 404) {
            await storage.db.update(pushSubscriptions)
              .set({ isActive: false, updatedAt: new Date() })
              .where(eq(pushSubscriptions.id, subscription.id));
            console.log(`🗑️ Subscription desativada (inválida): ${subscription.id}`);
          }
        }
      });
      
      await Promise.all(promises);
      
      // Salvar histórico da notificação
      await storage.db.insert(notificationHistory).values({
        title,
        body,
        icon: icon || '/shopee-icon.jpg',
        badge: badge || '/shopee-icon.jpg',
        tag: tag || 'shopee-admin-notification',
        data: notificationData || {},
        sentCount: subscriptions.length,
        successCount,
        failureCount,
        sentAt: new Date()
      });
      
      console.log(`📊 Resultado do envio: ${successCount} sucessos, ${failureCount} falhas`);
      
      res.json({
        success: true,
        message: 'Notificação enviada',
        stats: {
          total: subscriptions.length,
          success: successCount,
          failure: failureCount
        }
      });
    } catch (error) {
      console.error('❌ Erro ao enviar notificação:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
  
  // Listar histórico de notificações
  app.get('/api/notification-history', async (req: any, res) => {
    try {
      const history = await storage.db.select()
        .from(notificationHistory)
        .orderBy(notificationHistory.createdAt);
      
      res.json(history);
    } catch (error) {
      console.error('❌ Erro ao buscar histórico:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
  
  // Estatísticas de push notifications
  app.get('/api/push-stats', async (req: any, res) => {
    try {
      const activeSubscriptions = await storage.db.select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.isActive, true));
      
      const totalSubscriptions = await storage.db.select()
        .from(pushSubscriptions);
      
      const recentNotifications = await storage.db.select()
        .from(notificationHistory)
        .orderBy(notificationHistory.createdAt)
        .limit(5);
      
      res.json({
        activeSubscriptions: activeSubscriptions.length,
        totalSubscriptions: totalSubscriptions.length,
        recentNotifications: recentNotifications.length,
        lastNotifications: recentNotifications
      });
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
}