import React, { useState } from 'react';
import SearchForm from '../components/SearchForm';
import ProductList from '../components/ProductList';
import './App.css';

interface Product {
    price?: string;
    originalPrice?: string;
    link: string | null;
    discountPrice?: string;
    hasDiscount: boolean;
}

const App: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (product: string) => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:3000/scrape?product=${product}`);
            const data = await response.json();
            setProducts(data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        setLoading(false);
    };

    return (
        <div className="App">
            <h1>Scraper de Produtos</h1>
            <SearchForm onSearch={handleSearch} />
            {loading ? <p>Loading...</p> : <ProductList products={products} />}
        </div>
    );
};

export default App;