import { HomeContainer, Product } from '../styles/pages/home';
import Image from 'next/image';
import { useKeenSlider } from 'keen-slider/react';

import 'keen-slider/keen-slider.min.css';
import { stripe } from '../lib/stripe';
import { GetStaticProps } from 'next';
import Stripe from 'stripe';

interface HomeProps {
  products: {
    id: string;
    name: string;
    imageUrl: string;
    price: number;
  }[];
}

export default function Home({ products }: HomeProps) {
  const [sliderRef] = useKeenSlider({
    slides: {
      perView: 2.5,
      spacing: 48,
    },
  });

  return (
    <HomeContainer ref={sliderRef} className="keen-slider">
      {products.map((product) => {
        return (
          <Product key={product.id} className="keen-slider__slide">
            <Image
              src={product.imageUrl}
              width={520}
              height={480}
              alt="camisa1"
            />

            <footer>
              <strong>{product.name}</strong>
              <span>{product.price}</span>
            </footer>
          </Product>
        );
      })}
    </HomeContainer>
  );
}

// Faz a requisição para a API do Stripe e retorna os produtos do lado do servidor (SSR) do Next.js em toda requisição para a página home tendo acesso aos contextos da requisição, diferente do SSG.
// export const getServerSideProps: GetServerSideProps = async () => {
//   const response = await stripe.products.list({
//     expand: ['data.default_price'],
//   });

//   const products = response.data.map((product) => {
//     const price = product.default_price as Stripe.Price;

//     return {
//       id: product.id,
//       name: product.name,
//       imageUrl: product.images[0],
//       price: price.unit_amount && price.unit_amount / 100,
//     };
//   });

//   return {
//     props: {
//       products,
//     },
//   };
// };

// Faz a requisição para a API do Stripe e retorna os produtos do lado do servidor do Next.js mas para o intuito de SSG funcionando somente em produção ou executar como se estivesse em produção, fazendo uma só vez e sem acesso ao contexto da requisição.
export const getStaticProps: GetStaticProps = async () => {
  const response = await stripe.products.list({
    expand: ['data.default_price'],
  });

  const products = response.data.map((product) => {
    const price = product.default_price as Stripe.Price;

    return {
      id: product.id,
      name: product.name,
      imageUrl: product.images[0],
      price:
        price.unit_amount &&
        new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(price.unit_amount / 100),
    };
  });

  return {
    props: {
      products,
    },
    revalidate: 60 * 60 * 2, // 2 horas
  };
};

// Próxima aula: Produto & Checkout (4)
