// Пример гардероба, чтобы посмотреть, как работает подбор. Убирается одной кнопкой во вкладке «Я».
export const DEMO = [
  ['blouse', 'milk'], ['tshirt', 'white'], ['turtleneck', 'graphite'], ['sweater', 'camel'], ['shirt', 'lightblue'],
  ['blouse', 'terracotta'], ['trousers', 'graphite'], ['jeans', 'denim'], ['skirtmidi', 'olive'], ['trousers', 'beige'],
  ['dress', 'green'], ['cocktail', 'burgundy'], ['blazer', 'beige'], ['cardigan', 'milk'], ['trench', 'beige'],
  ['coat', 'camel'], ['puffer', 'black'], ['leather', 'black'], ['sneakers', 'white'], ['loafers', 'black'],
  ['ankleboots', 'brown'], ['heels', 'beige'], ['boots', 'black'], ['bag', 'camel'], ['clutch', 'black'],
  ['scarf', 'terracotta'], ['hat', 'graphite'], ['leggings', 'black'], ['hoodie', 'grey'], ['sporttop', 'black'],
].map(([type, color], i) => ({ id: 'demo' + i, type, color, demo: 1 }));
