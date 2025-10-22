// Utility functions for favourites management

export const getFavourites = () => {
  try {
    const favourites = localStorage.getItem('favouriteProducts');
    return favourites ? JSON.parse(favourites) : {};
  } catch (error) {
    console.error('Error loading favourites:', error);
    return {};
  }
};

export const addToFavourites = (product) => {
  try {
    const favourites = getFavourites();
    favourites[product.code] = {
      code: product.code,
      name: product.name,
      image: product.image,
      ecoScore: product.ecoScore,
      brand: product.brand || '',
      addedAt: new Date().toISOString()
    };
    localStorage.setItem('favouriteProducts', JSON.stringify(favourites));
    return true;
  } catch (error) {
    console.error('Error adding to favourites:', error);
    return false;
  }
};

export const removeFromFavourites = (code) => {
  try {
    const favourites = getFavourites();
    delete favourites[code];
    localStorage.setItem('favouriteProducts', JSON.stringify(favourites));
    return true;
  } catch (error) {
    console.error('Error removing from favourites:', error);
    return false;
  }
};

export const isFavourite = (code) => {
  const favourites = getFavourites();
  return !!favourites[code];
};
