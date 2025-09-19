import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, ThumbsUp, Clock } from 'lucide-react';

interface Comment {
  id: number;
  name: string;
  gender: 'M' | 'F';
  message: string;
  likes: number;
  timeAgo: string;
  replies?: Comment[];
  isReply?: boolean;
}

const comments: Comment[] = [
  {
    id: 1,
    name: "Carlos Mendes",
    gender: "M",
    message: "Gente, alguém pode explicar sobre essa cobrança do kit de EPI e cartão?",
    likes: 12,
    timeAgo: "2h",
    replies: [
      {
        id: 2,
        name: "Ana Paula Santos",
        gender: "F",
        message: "Carlos, essa cobrança é pra pagar a entrega dos EPIs e do cartão oficial da Shopee. Chega rapidinho, em 3-5 dias úteis. Vale muito a pena!",
        likes: 28,
        timeAgo: "1h",
        isReply: true
      }
    ]
  },
  {
    id: 3,
    name: "Roberto Silva",
    gender: "M",
    message: "Trabalho como entregador da Shopee há 6 meses e tô tirando em média R$680 por dia. Melhor decisão que tomei!",
    likes: 45,
    timeAgo: "3h"
  },
  {
    id: 4,
    name: "Mariana Costa",
    gender: "F",
    message: "Eu trabalho meio período porque tenho outro emprego, mas mesmo assim consigo uns R$350-400 por dia. Ótimo pra complementar a renda!",
    likes: 32,
    timeAgo: "4h"
  },
  {
    id: 5,
    name: "Diego Ferreira",
    gender: "M",
    message: "Alguém pode dizer se é muito difícil fazer as entregas?",
    likes: 8,
    timeAgo: "5h",
    replies: [
      {
        id: 6,
        name: "Lucas Oliveira",
        gender: "M",
        message: "Diego, cara, não é difícil não! O app da Shopee é bem fácil de usar, te guia pras entregas e tem suporte 24h. Você pega o jeito rápido, relaxa!",
        likes: 19,
        timeAgo: "4h",
        isReply: true
      }
    ]
  },
  {
    id: 7,
    name: "Fernando Santos",
    gender: "M",
    message: "Comecei semana passada e já estou fazendo R$520 por dia. O pessoal da Shopee é muito solicito, sempre ajudam quando preciso.",
    likes: 23,
    timeAgo: "6h"
  },
  {
    id: 8,
    name: "Patricia Lopes",
    gender: "F",
    message: "Recomendo demais! Trabalho de manhã no escritório e tarde faço entregas. Consegui comprar minha moto nova só com o dinheiro das entregas 😊",
    likes: 41,
    timeAgo: "7h"
  },
  {
    id: 9,
    name: "André Almeida",
    gender: "M",
    message: "Pessoal, tô conseguindo tirar uns R$750 por dia trabalhando das 7h as 19h. Vale muito a pena o investimento inicial!",
    likes: 37,
    timeAgo: "8h"
  },
  {
    id: 10,
    name: "João Pedro",
    gender: "M",
    message: "Trabalho como entregador da Shopee há 1 ano. Já consegui pagar todas minhas dívidas e ainda sobra dinheiro. Mudou minha vida!",
    likes: 56,
    timeAgo: "9h"
  },
  {
    id: 11,
    name: "Juliana Rocha",
    gender: "F",
    message: "Faço entregas só nos fins de semana e consigo uns R$400-500 por dia. Perfeito pra quem quer uma renda extra!",
    likes: 29,
    timeAgo: "10h"
  },
  {
    id: 12,
    name: "Marcos Vieira",
    gender: "M",
    message: "Melhor coisa que fiz foi me cadastrar na Shopee. Tô ganhando bem mais do que no meu emprego anterior. Média de R$620 por dia.",
    likes: 44,
    timeAgo: "11h"
  },
  {
    id: 13,
    name: "Ricardo Nunes",
    gender: "M",
    message: "Galera, o suporte da Shopee é excelente. Sempre que tenho alguma dúvida eles respondem super rápido no whatsapp.",
    likes: 18,
    timeAgo: "12h"
  },
  {
    id: 14,
    name: "Thiago Barbosa",
    gender: "M",
    message: "Trabalho das 8h às 17h e consigo fazer uns R$580 por dia. O bom é que você escolhe seus horários, tem flexibilidade total.",
    likes: 35,
    timeAgo: "13h"
  },
  {
    id: 15,
    name: "Camila Torres",
    gender: "F",
    message: "Comecei há 2 meses e já consegui juntar uma boa grana. O investimento no kit se paga rapidinho, vale muito a pena mesmo!",
    likes: 26,
    timeAgo: "14h"
  },
  {
    id: 16,
    name: "Rafael Lima",
    gender: "M",
    message: "Cara, eu era cético no começo mas depois de 3 meses fazendo entregas posso dizer: melhor investimento da minha vida. Tiro uns R$700 por dia tranquilo.",
    likes: 42,
    timeAgo: "15h"
  },
  {
    id: 17,
    name: "Eduardo Matos",
    gender: "M",
    message: "A plataforma da Shopee é muito organizada. Você sabe exatamente quanto vai receber por cada entrega, sem surpresas.",
    likes: 21,
    timeAgo: "16h"
  },
  {
    id: 18,
    name: "Gustavo Pereira",
    gender: "M",
    message: "Pessoal, trabalho meio período e consigo R$420 por dia. Perfeito pra quem precisa de horário flexivel.",
    likes: 31,
    timeAgo: "17h"
  },
  {
    id: 19,
    name: "Bruno Costa",
    gender: "M",
    message: "Fiz o cadastro mês passado e já estou fazendo uma média de R$640 por dia. O treinamento online é muito bom, ensina tudo direitinho.",
    likes: 38,
    timeAgo: "18h"
  },
  {
    id: 20,
    name: "Daniela Martins",
    gender: "F",
    message: "Trabalho de segunda a sexta, meio período, e consigo uma renda extra muito boa. Recomendo pra todas as mulheres que querem independencia financeira!",
    likes: 47,
    timeAgo: "19h"
  },
  {
    id: 21,
    name: "Alexandre Santos",
    gender: "M",
    message: "O que mais gosto é a liberdade de escolher meus horários. Trabalho quando quero e ganho em média R$580 por dia. Top demais!",
    likes: 33,
    timeAgo: "20h"
  },
  {
    id: 22,
    name: "Vinicius Alves",
    gender: "M",
    message: "Pessoal, sobre o cartão de crédito com limite de R$ 1.900, ele realmente funciona em todos os lugares?",
    likes: 15,
    timeAgo: "21h",
    replies: [
      {
        id: 23,
        name: "Rodrigo Mendonça",
        gender: "M",
        message: "Vinicius, cara, o cartão passa em tudo mesmo! Uso em mercado, posto, loja, farmácia... E o melhor é que o limite vai aumentando conforme você trabalha. O meu começou com R$ 1.900 e hoje, depois de 3 meses fazendo entregas, já tá em R$ 5.000! Vale demais a pena!",
        likes: 52,
        timeAgo: "20h",
        isReply: true
      }
    ]
  }
];

const CommentsSection: React.FC = () => {
  const [showAllComments, setShowAllComments] = useState(false);
  const [likedComments, setLikedComments] = useState<Set<number>>(new Set());

  const handleLike = (commentId: number) => {
    const newLikedComments = new Set(likedComments);
    if (newLikedComments.has(commentId)) {
      newLikedComments.delete(commentId);
    } else {
      newLikedComments.add(commentId);
    }
    setLikedComments(newLikedComments);
  };

  const renderComment = (comment: Comment) => (
    <div key={comment.id} className={`${comment.isReply ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
      <div className="flex items-start space-x-3 mb-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
          comment.gender === 'M' ? 'bg-blue-500' : 'bg-pink-500'
        }`}>
          {comment.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
        </div>
        <div className="flex-1">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-gray-900 text-sm">{comment.name}</h4>
              <div className="flex items-center text-gray-500 text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {comment.timeAgo}
              </div>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">{comment.message}</p>
          </div>
          <div className="flex items-center mt-2 space-x-4">
            <button
              onClick={() => handleLike(comment.id)}
              className={`flex items-center space-x-1 text-xs transition-colors ${
                likedComments.has(comment.id) ? 'text-[#EE4E2E]' : 'text-gray-500 hover:text-[#EE4E2E]'
              }`}
            >
              <ThumbsUp className="w-3 h-3" />
              <span>{comment.likes + (likedComments.has(comment.id) ? 1 : 0)}</span>
            </button>
          </div>
        </div>
      </div>
      {comment.replies && comment.replies.map(reply => renderComment(reply))}
    </div>
  );

  const visibleComments = showAllComments ? comments : comments.slice(0, 6);

  return (
    <Card className="mt-8 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <MessageCircle className="w-5 h-5 text-[#EE4E2E]" />
        <h3 className="text-xl font-bold text-gray-900">
          Comentários dos Entregadores Shopee
        </h3>
        <span className="bg-[#EE4E2E] text-white text-xs px-2 py-1 rounded-full">
          {comments.length + 2} comentários
        </span>
      </div>

      <div className="space-y-4">
        {visibleComments.map(comment => renderComment(comment))}
      </div>

      {!showAllComments && comments.length > 6 && (
        <div className="text-center mt-6">
          <Button
            onClick={() => setShowAllComments(true)}
            variant="outline"
            className="text-[#EE4E2E] border-[#EE4E2E] hover:bg-[#EE4E2E] hover:text-white"
          >
            Ver todos os comentários ({comments.length + 2})
          </Button>
        </div>
      )}

      {showAllComments && (
        <div className="text-center mt-6">
          <Button
            onClick={() => setShowAllComments(false)}
            variant="outline"
            className="text-gray-600 border-gray-300 hover:bg-gray-100"
          >
            Mostrar menos comentários
          </Button>
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-600 text-center">
          💬 <strong>Faça parte desta comunidade!</strong> Cadastre-se agora e comece a ganhar como entregador oficial da Shopee.
        </p>
      </div>
    </Card>
  );
};

export default CommentsSection;