import { Badge } from './ui/badge';
import { Card, CardContent, CardFooter, CardTitle } from './ui/card';

const popularProducts = [
  {
    id: 1,
    name: 'Adidas CoreFit T-Shirt',
    shortDescription:
      'Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.',
    description:
      'Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.',
    price: 39.9,
    sizes: ['s', 'm', 'l', 'xl', 'xxl'],
    colors: ['gray', 'purple', 'green'],
    images: {
      gray: '/products/1g.png',
      purple: '/products/1p.png',
      green: '/products/1gr.png',
    },
  },
  {
    id: 2,
    name: 'Puma Ultra Warm Zip',
    shortDescription:
      'Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.',
    description:
      'Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.',
    price: 59.9,
    sizes: ['s', 'm', 'l', 'xl'],
    colors: ['gray', 'green'],
    images: { gray: '/products/2g.png', green: '/products/2gr.png' },
  },
  {
    id: 3,
    name: 'Nike Air Essentials Pullover',
    shortDescription:
      'Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.',
    description:
      'Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.',
    price: 69.9,
    sizes: ['s', 'm', 'l'],
    colors: ['green', 'blue', 'black'],
    images: {
      green: '/products/3gr.png',
      blue: '/products/3b.png',
      black: '/products/3bl.png',
    },
  },
  {
    id: 4,
    name: 'Nike Dri Flex T-Shirt',
    shortDescription:
      'Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.',
    description:
      'Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.',
    price: 29.9,
    sizes: ['s', 'm', 'l'],
    colors: ['white', 'pink'],
    images: { white: '/products/4w.png', pink: '/products/4p.png' },
  },
  {
    id: 5,
    name: 'Under Armour StormFleece',
    shortDescription:
      'Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.',
    description:
      'Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.',
    price: 49.9,
    sizes: ['s', 'm', 'l'],
    colors: ['red', 'orange', 'black'],
    images: {
      red: '/products/5r.png',
      orange: '/products/5o.png',
      black: '/products/5bl.png',
    },
  },
  {
    id: 6,
    name: 'Nike Air Max 270',
    shortDescription:
      'Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.',
    description:
      'Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.',
    price: 59.9,
    sizes: ['40', '42', '43', '44'],
    colors: ['gray', 'white'],
    images: { gray: '/products/6g.png', white: '/products/6w.png' },
  },
  {
    id: 7,
    name: 'Nike Ultraboost Pulse ',
    shortDescription:
      'Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.',
    description:
      'Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.',
    price: 69.9,
    sizes: ['40', '42', '43'],
    colors: ['gray', 'pink'],
    images: { gray: '/products/7g.png', pink: '/products/7p.png' },
  },
  {
    id: 8,
    name: 'Levi’s Classic Denim',
    shortDescription:
      'Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.',
    description:
      'Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.',
    price: 59.9,
    sizes: ['s', 'm', 'l'],
    colors: ['blue', 'green'],
    images: { blue: '/products/8b.png', green: '/products/8gr.png' },
  },
];

const latestTransactions = [
  {
    id: 1,
    title: 'Order Payment',
    badge: 'John Doe',
    image:
      'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=800',
    count: 1400,
  },
  {
    id: 2,
    title: 'Order Payment',
    badge: 'Jane Smith',
    image:
      'https://images.pexels.com/photos/4969918/pexels-photo-4969918.jpeg?auto=compress&cs=tinysrgb&w=800',
    count: 2100,
  },
  {
    id: 3,
    title: 'Order Payment',
    badge: 'Michael Johnson',
    image:
      'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=800',
    count: 1300,
  },
  {
    id: 4,
    title: 'Order Payment',
    badge: 'Lily Adams',
    image:
      'https://images.pexels.com/photos/712513/pexels-photo-712513.jpeg?auto=compress&cs=tinysrgb&w=800',
    count: 2500,
  },
  {
    id: 5,
    title: 'Order Payment',
    badge: 'Sam Brown',
    image:
      'https://images.pexels.com/photos/1680175/pexels-photo-1680175.jpeg?auto=compress&cs=tinysrgb&w=800',
    count: 1400,
  },
];

const CardList = ({ title }: { title: string }) => {
  return (
    <div className="">
      <h1 className="mb-6 text-lg font-medium">{title}</h1>
      <div className="flex flex-col gap-2">
        {title === 'Popular Products'
          ? popularProducts.map((item) => (
              <Card
                key={item.id}
                className="flex-row items-center justify-between gap-4 p-4"
              >
                <div className="relative h-12 w-12 overflow-hidden rounded-sm">
                  <img
                    src={Object.values(item.images)[0] || ''}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <CardContent className="flex-1 p-0">
                  <CardTitle className="text-sm font-medium">
                    {item.name}
                  </CardTitle>
                </CardContent>
                <CardFooter className="p-0">{item.price}K</CardFooter>
              </Card>
            ))
          : latestTransactions.map((item) => (
              <Card
                key={item.id}
                className="flex-row items-center justify-between gap-4 p-4"
              >
                <div className="relative h-12 w-12 overflow-hidden rounded-sm">
                  <img
                    src={item.image || ''}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <CardContent className="flex-1 p-0">
                  <CardTitle className="text-sm font-medium">
                    {item.title}
                  </CardTitle>
                  <Badge variant="secondary">{item.badge}</Badge>
                </CardContent>
                <CardFooter className="p-0">${item.count / 100}K</CardFooter>
              </Card>
            ))}
      </div>
    </div>
  );
};

export default CardList;
