import {
  ImageContainer,
  ProductContainer,
  ProductDetails,
} from '@/src/styles/pages/product';

import { GetStaticPaths, GetStaticProps } from 'next';
import { stripe } from '@/src/lib/stripe';
import Stripe from 'stripe';
import Image from 'next/image';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useState } from 'react';

interface ProductProps {
  product: {
    id: string;
    name: string;
    imageUrl: string;
    price: string;
    defaultPriceId: string;
    description: string;
  };
}

export default function Product({ product }: ProductProps) {
  const [isCreatingCheckouSession, setIsCreatingCheckoutSession] =
    useState<boolean>(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isFallback, push: routerPush } = useRouter();

  if (isFallback) {
    return <p>Loading...</p>;
  }

  async function handleBuyProduct() {
    try {
      setIsCreatingCheckoutSession(true);
      const response = await axios.post('/api/checkout', {
        priceId: product.defaultPriceId,
      });

      const { checkoutUrl } = response.data;

      // Direcionar para uma URL externa
      window.location.href = checkoutUrl;

      // Direcionar para um rota interna
      // routerPush('/success');
    } catch (err) {
      // Conectar com uma ferramenta de observabilidade (Datalog, Sentry, etc)
      setIsCreatingCheckoutSession(false);

      alert('Erro ao realizar a compra, tente novamente mais tarde');
      console.error(err);
    }
  }

  return (
    <ProductContainer>
      <ImageContainer>
        <Image src={product.imageUrl} width={520} height={480} alt="camisa1" />
      </ImageContainer>
      <ProductDetails>
        <h1>{product.name}</h1>
        <span>{product.price}</span>

        <p>{product.description}</p>

        <button disabled={isCreatingCheckouSession} onClick={handleBuyProduct}>
          Comprar agora
        </button>
      </ProductDetails>
    </ProductContainer>
  );
}

// Parâmetros para gerar as páginas estáticas no momento da build
export const getStaticPaths: GetStaticPaths = async () => {
  // Buscar os produtos mais vendidos / acessados

  return {
    paths: [{ params: { id: 'prod_RTK4KChT28oSQA' } }],
    fallback: true, // permite que a página seja gerada no momento da requisição dos produtos que não estão na lista de paths
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getStaticProps: GetStaticProps<any, { id: string }> = async ({
  params,
}) => {
  if (!params) {
    throw new Error('Params not found');
  }

  const productId = params.id;

  const product = await stripe.products.retrieve(productId, {
    expand: ['default_price'],
  });

  const price = product.default_price as Stripe.Price;

  return {
    props: {
      product: {
        id: product.id,
        name: product.name,
        imageUrl: product.images[0],
        price:
          price.unit_amount &&
          new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(price.unit_amount / 100),
        defaultPriceId: price.id,
        description: product.description,
      },
    },
    revalidate: 60 * 60 * 1, // 1 hour
  };
};
