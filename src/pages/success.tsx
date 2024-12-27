import Link from 'next/link';
import { ImageContainer, SuccessContainer } from '../styles/pages/success';
import { GetServerSideProps } from 'next';
import { stripe } from '../lib/stripe';
import Stripe from 'stripe';
import Image from 'next/image';

interface SuccessProps {
  custumerName: string;
  product: {
    name: string;
    imageUrl: string;
  };
}

export default function Success({ custumerName, product }: SuccessProps) {
  return (
    <SuccessContainer>
      <h1>Compra realizada com sucesso!</h1>

      <ImageContainer>
        <Image
          src={product.imageUrl}
          width={120}
          height={120}
          alt="imagem do produto"
        />
      </ImageContainer>

      <p>
        Uhuul <strong>{custumerName}</strong>, sua{' '}
        <strong>{product.name}</strong> está a caminho! 🚀
      </p>

      <Link href={`/`}>Voltar ao catálogo</Link>
    </SuccessContainer>
  );
}

// Client-Side (useEffect - ReactJS) - Pode fazer, mas não é o ideal. A segurança do usuário pode ser comprometida, por utilizar a chave privada do Stripe no front-end
// Server-Side (getServerSideProps - SSR) - Ideal para essa página, pois é necessário verificar se a compra foi realizada com sucesso
// Static-Site (getStaticProps - SSG) - Não faz sentido para essa página

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  if (!query.session_id) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  const sessionId = String(query.session_id);

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items', 'line_items.data.price.product'],
  });

  if (session.payment_status !== 'paid') {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  if (!session) {
    throw new Error('Session not found');
  }

  const custumerName = session.customer_details?.name || 'Cliente';
  const product = session.line_items?.data[0]?.price?.product as Stripe.Product;

  if (!product) {
    throw new Error('Product not found');
  }

  return {
    props: {
      custumerName,
      product: {
        name: product.name,
        imageUrl: product.images[0],
      },
    },
  };
};
