import React from "react";

interface Product {
    price?: string;
    originalPrice?: string;
    link: string | null | undefined;
    discountPrice?: string;
    hasDiscount: boolean;
}

interface ProductListProps {
    products: Product[];
}

const ProductList: React.FC<ProductListProps> = ({ products }) => {
    return (
        <div>
            {products.map( ( product, index ) => (
                <div key={index}>
                    <a href={product.link!} target="_blank" rel="noopener noreferrer">
                        {product.link}
                    </a>
                    <p>Preço: {product.hasDiscount ? product.discountPrice : product.price}</p>
                    {product.hasDiscount && <p>Preço original: {product.originalPrice}</p>}
                </div>
            ))}
        </div>
    );
};

export default ProductList;