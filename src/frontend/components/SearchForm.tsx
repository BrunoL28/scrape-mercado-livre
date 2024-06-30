import React, { useState } from 'react';

interface SearchFormProps {
    onSearch: ( product: string ) => void;
}

const SearchForm: React.FC<SearchFormProps> = ({ onSearch }) => {
    const [product, setProduct] = useState( '' );

    const handleSubmit = ( event: React.FormEvent ) => {
        event.preventDefault();
        onSearch( product );
    };

    return ( 
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder="Digite o nome do produto"
            />
            <button type="submit">Buscar</button>
        </form>
    );
}

export default SearchForm;