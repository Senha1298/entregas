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
  profileImage?: string;
  replies?: Comment[];
  isReply?: boolean;
}

const profileImages = {
  men: [
    "https://scontent.fbsb20-1.fna.fbcdn.net/v/t39.30808-6/502578848_9876083289153468_4046710841254946707_n.jpg",
    "https://scontent.fbsb20-1.fna.fbcdn.net/v/t1.6435-9/46115522_1110968849065045_2668519337702195200_n.jpg",
    "https://scontent.fbsb20-1.fna.fbcdn.net/v/t1.6435-9/125569600_4230737243609287_3967131514222108780_n.jpg",
    "https://scontent.fbsb20-1.fna.fbcdn.net/v/t1.6435-9/117642521_3162684067147368_6477709627897357665_n.jpg",
    "https://scontent.fbsb20-1.fna.fbcdn.net/v/t1.6435-9/35428326_2373982669285586_7798509717214461952_n.jpg",
    "https://scontent.fbsb20-1.fna.fbcdn.net/v/t1.6435-9/82386770_3090845140944454_8007982742089818112_n.jpg",
    "https://scontent.fbsb20-1.fna.fbcdn.net/v/t1.6435-9/75547436_2908388785856758_5796952577577623552_n.jpg",
    "https://scontent.fbsb20-1.fna.fbcdn.net/v/t1.6435-9/65609234_2620802747982031_5169823158906077184_n.jpg",
    "https://scontent.fbsb20-1.fna.fbcdn.net/v/t1.6435-9/53962593_2458064907589150_6077681926949396480_n.jpg",
    "https://scontent.fbsb20-1.fna.fbcdn.net/v/t1.6435-9/49624659_2364831386879070_2536106062458519552_n.jpg",
    "https://scontent.fbsb20-1.fna.fbcdn.net/v/t1.6435-9/40736434_2197065350322342_4334962648397144064_n.jpg",
    "https://scontent.fbsb20-1.fna.fbcdn.net/v/t1.6435-9/35690234_2084709888224556_2628262977493049344_n.jpg",
    "https://scontent.fbsb20-1.fna.fbcdn.net/v/t1.6435-9/29570513_1944398308922382_8442781012636508160_n.jpg",
    "https://scontent.fbsb20-1.fna.fbcdn.net/v/t1.6435-9/26168262_1851816718180542_6968623411892092928_n.jpg",
    "https://scontent.fbsb20-1.fna.fbcdn.net/v/t1.6435-9/19732284_1624388784257004_8134159068779081728_n.jpg"
  ],
  women: [
    "https://scontent.fbsb20-1.fna.fbcdn.net/v/t39.30808-6/482135135_3865073400435738_6789123456789012345_n.jpg",
    "https://scontent.fbsb20-1.fna.fbcdn.net/v/t1.6435-9/123456789_1234567890123456_1234567890123456789_n.jpg",
    "https://scontent.fbsb20-1.fna.fbcdn.net/v/t1.6435-9/987654321_9876543210987654_9876543210987654321_n.jpg",
    "https://scontent.fbsb20-1.fna.fbcdn.net/v/t1.6435-9/456789123_4567891234567891_4567891234567891234_n.jpg",
    "https://scontent.fbsb20-1.fna.fbcdn.net/v/t1.6435-9/789123456_7891234567891234_7891234567891234567_n.jpg"
  ]
};

const comments: Comment[] = [
  {
    id: 3,
    name: "Roberto Silva",
    gender: "M",
    message: "Trabalho como entregador da Shopee há 6 meses e tô tirando em média R$680 por dia. Melhor decisão que tomei!",
    likes: 45,
    timeAgo: "3h",
    profileImage: profileImages.men[0]
  },
  {
    id: 4,
    name: "Mariana Costa",
    gender: "F",
    message: "Eu trabalho meio período porque tenho outro emprego, mas mesmo assim consigo uns R$350-400 por dia. Ótimo pra complementar a renda!",
    likes: 32,
    timeAgo: "4h",
    profileImage: profileImages.women[0]
  },
  {
    id: 5,
    name: "Diego Ferreira",
    gender: "M",
    message: "Alguém pode dizer se é muito difícil fazer as entregas?",
    likes: 8,
    timeAgo: "5h",
    profileImage: profileImages.men[1],
    replies: [
      {
        id: 6,
        name: "Lucas Oliveira",
        gender: "M",
        message: "Diego, cara, não é difícil não! O app da Shopee é bem fácil de usar, te guia pras entregas e tem suporte 24h. Você pega o jeito rápido, relaxa!",
        likes: 19,
        timeAgo: "4h",
        profileImage: profileImages.men[2],
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
    timeAgo: "6h",
    profileImage: profileImages.men[3]
  },
  {
    id: 1,
    name: "Carlos Mendes",
    gender: "M",
    message: "Gente, alguém pode explicar sobre essa cobrança do kit de EPI e cartão?",
    likes: 12,
    timeAgo: "2h",
    profileImage: profileImages.men[4],
    replies: [
      {
        id: 2,
        name: "Ana Paula Santos",
        gender: "F",
        message: "Carlos, essa cobrança é pra pagar a entrega dos EPIs e do cartão oficial da Shopee. Chega rapidinho, em 3-5 dias úteis. Vale muito a pena!",
        likes: 28,
        timeAgo: "1h",
        profileImage: profileImages.women[1],
        isReply: true
      }
    ]
  },
  {
    id: 8,
    name: "Patricia Lopes",
    gender: "F",
    message: "Recomendo demais! Trabalho de manhã no escritório e tarde faço entregas. Consegui comprar minha moto nova só com o dinheiro das entregas 😊",
    likes: 41,
    timeAgo: "7h",
    profileImage: profileImages.women[2]
  },
  {
    id: 9,
    name: "André Almeida",
    gender: "M",
    message: "Pessoal, tô conseguindo tirar uns R$750 por dia trabalhando das 7h as 19h. Vale muito a pena o investimento inicial!",
    likes: 37,
    timeAgo: "8h",
    profileImage: profileImages.men[5]
  },
  {
    id: 10,
    name: "João Pedro",
    gender: "M",
    message: "Trabalho como entregador da Shopee há 1 ano. Já consegui pagar todas minhas dívidas e ainda sobra dinheiro. Mudou minha vida!",
    likes: 56,
    timeAgo: "9h",
    profileImage: profileImages.men[6]
  },
  {
    id: 11,
    name: "Juliana Rocha",
    gender: "F",
    message: "Faço entregas só nos fins de semana e consigo uns R$400-500 por dia. Perfeito pra quem quer uma renda extra!",
    likes: 29,
    timeAgo: "10h",
    profileImage: profileImages.women[3]
  },
  {
    id: 12,
    name: "Marcos Vieira",
    gender: "M",
    message: "Melhor coisa que fiz foi me cadastrar na Shopee. Tô ganhando bem mais do que no meu emprego anterior. Média de R$620 por dia.",
    likes: 44,
    timeAgo: "11h",
    profileImage: profileImages.men[7]
  },
  {
    id: 13,
    name: "Ricardo Nunes",
    gender: "M",
    message: "Galera, o suporte da Shopee é excelente. Sempre que tenho alguma dúvida eles respondem super rápido no whatsapp.",
    likes: 18,
    timeAgo: "12h",
    profileImage: profileImages.men[8]
  },
  {
    id: 14,
    name: "Thiago Barbosa",
    gender: "M",
    message: "Trabalho das 8h às 17h e consigo fazer uns R$580 por dia. O bom é que você escolhe seus horários, tem flexibilidade total.",
    likes: 35,
    timeAgo: "13h",
    profileImage: profileImages.men[9]
  },
  {
    id: 15,
    name: "Camila Torres",
    gender: "F",
    message: "Comecei há 2 meses e já consegui juntar uma boa grana. O investimento no kit se paga rapidinho, vale muito a pena mesmo!",
    likes: 26,
    timeAgo: "14h",
    profileImage: profileImages.women[4]
  },
  {
    id: 16,
    name: "Rafael Lima",
    gender: "M",
    message: "Cara, eu era cético no começo mas depois de 3 meses fazendo entregas posso dizer: melhor investimento da minha vida. Tiro uns R$700 por dia tranquilo.",
    likes: 42,
    timeAgo: "15h",
    profileImage: profileImages.men[10]
  },
  {
    id: 17,
    name: "Eduardo Matos",
    gender: "M",
    message: "A plataforma da Shopee é muito organizada. Você sabe exatamente quanto vai receber por cada entrega, sem surpresas.",
    likes: 21,
    timeAgo: "16h",
    profileImage: profileImages.men[11]
  },
  {
    id: 18,
    name: "Gustavo Pereira",
    gender: "M",
    message: "Pessoal, trabalho meio período e consigo R$420 por dia. Perfeito pra quem precisa de horário flexivel.",
    likes: 31,
    timeAgo: "17h",
    profileImage: profileImages.men[12]
  },
  {
    id: 19,
    name: "Bruno Costa",
    gender: "M",
    message: "Fiz o cadastro mês passado e já estou fazendo uma média de R$640 por dia. O treinamento online é muito bom, ensina tudo direitinho.",
    likes: 38,
    timeAgo: "18h",
    profileImage: profileImages.men[13]
  },
  {
    id: 20,
    name: "Daniela Martins",
    gender: "F",
    message: "Trabalho de segunda a sexta, meio período, e consigo uma renda extra muito boa. Recomendo pra todas as mulheres que querem independencia financeira!",
    likes: 47,
    timeAgo: "19h",
    profileImage: profileImages.women[0]
  },
  {
    id: 21,
    name: "Alexandre Santos",
    gender: "M",
    message: "O que mais gosto é a liberdade de escolher meus horários. Trabalho quando quero e ganho em média R$580 por dia. Top demais!",
    likes: 33,
    timeAgo: "20h",
    profileImage: profileImages.men[14]
  },
  {
    id: 22,
    name: "Vinicius Alves",
    gender: "M",
    message: "Pessoal, sobre o cartão de crédito com limite de R$ 1.900, ele realmente funciona em todos os lugares?",
    likes: 15,
    timeAgo: "21h",
    profileImage: profileImages.men[0],
    replies: [
      {
        id: 23,
        name: "Rodrigo Mendonça",
        gender: "M",
        message: "Vinicius, cara, o cartão passa em tudo mesmo! Uso em mercado, posto, loja, farmácia... E o melhor é que o limite vai aumentando conforme você trabalha. O meu começou com R$ 1.900 e hoje, depois de 3 meses fazendo entregas, já tá em R$ 5.000! Vale demais a pena!",
        likes: 52,
        timeAgo: "20h",
        profileImage: profileImages.men[1],
        isReply: true
      }
    ]
  }
];

const CommentsSection: React.FC = () => {
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
        {comment.profileImage ? (
          <img 
            src={comment.profileImage} 
            alt={comment.name}
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => {
              // Fallback to initials if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
          comment.gender === 'M' ? 'bg-blue-500' : 'bg-pink-500'
        } ${comment.profileImage ? 'hidden' : ''}`}>
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

  // Show all comments by default

  return (
    <Card className="mt-8 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <MessageCircle className="w-8 h-8 text-[#EE4E2E]" />
        <h3 className="text-xl font-bold text-gray-900">
          Comentários dos Entregadores Shopee
        </h3>
      </div>

      <div className="space-y-4">
        {comments.map(comment => renderComment(comment))}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-600 text-center">
          💬 <strong>Faça parte desta comunidade!</strong> Cadastre-se agora e comece a ganhar como entregador oficial da Shopee.
        </p>
      </div>
    </Card>
  );
};

export default CommentsSection;