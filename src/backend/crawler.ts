import { Builder, By, until, WebDriver } from "selenium-webdriver";
import * as fs from "fs";
import * as chrome from "selenium-webdriver/chrome";
const chromeDriver = "C:/Users/bruno/chromedriver-win32/chromedriver.exe";

type Products =
    | {
        price: string;
        link: string | null;
        hasDiscount: false;
    }
    | {
        originalPrice: string;
        link: string | null;
        discountPrice: string;
        hasDiscount: true;
    };

function imprimeErro ( error: unknown ) {
    console.log( error );
}

async function getItemPrices ( page: WebDriver, products: Products[] ) {
    const itemList = await page.findElements( By.css( ".ui-search-layout__item" ) );
    if ( !itemList ) {
        console.log( `Nenhum item encontrado na página` );
        return;
    }

    for ( const item of itemList ) {
        const price = await item.findElement( By.css( ".ui-search-price__second-line" ) );
        const realPriceSpan = await price.findElement( By.css( ".andes-money-amount__fraction" ) );
        const realPrice = await realPriceSpan.getText();

        const linkDiv = await item.findElement( By.css( "a" ) );
        const link = await linkDiv.getAttribute( "href" );

        const hasOriginalPrice = await item.findElements(
            By.css( ".andes-money-amount.ui-search-price__original-value" )
        );

        if ( hasOriginalPrice.length > 0 ) {
            const originalPriceSpan = await hasOriginalPrice[0].findElement(
                By.css( ".andes-money-amount__fraction" )
            );
            const originalPrice = await originalPriceSpan.getText();

            products.push( {
                link,
                discountPrice: realPrice,
                originalPrice,
                hasDiscount: true,
            } );
            continue;
        }

        products.push( { price: realPrice, link, hasDiscount: false } );
    }

    console.log( `Produtos raspados com sucesso na página atual!` );
}

function parsePrice(price: string): number {
  return parseFloat(price.replace(/\./g, '').replace(',', '.'));
}

function getProductPrice(product: Products) {
  return product.hasDiscount
      ? parsePrice(product.discountPrice || '0')
      : parsePrice(product.price);
}

function getProductOriginalPrice(product: Products) {
  if (!product.hasDiscount) {
      return 0;
  }
  return parsePrice(product.originalPrice);
}

function getDiscountPercentage ( price: number, originalPrice: number ) {
    return `${( ( 1 - price / originalPrice ) * 100 ).toFixed( 0 )}%`;
}

export async function crawler ( product: string ) {
    let driver: WebDriver | null = null;
    try {
        console.log( "Iniciando o navegador" );
        const serviceBuilder = new chrome.ServiceBuilder( chromeDriver );

        const options = new chrome.Options();

        driver = await new Builder()
            .forBrowser( "chrome" )
            .setChromeService( serviceBuilder )
            .setChromeOptions( options )
            .build();

        console.log( "Navegador iniciado!" );
        await driver.get( "https://www.mercadolivre.com.br" );

        const searchBox = await driver.findElement( By.id( "cb1-edit" ) );
        await searchBox.sendKeys( product );

        const searchResultButton = await driver.findElement( By.css( ".nav-search-btn" ) );
        await driver.wait( until.elementIsVisible( searchResultButton ) );
        await searchResultButton.click();

        const products: Products[] = [];

        console.log( "Iniciando raspagem... Por favor, aguarde" );
        const startScrapingTime = process.hrtime();

        try {
            const consentBanner = await driver.findElement( By.css( ".cookie-consent-banner-opt-out__container" ) );
            const consentButton = await consentBanner.findElement( By.css( "button" ) );
            await consentButton.click();
        } catch ( e ) {
            console.log( "Nenhum banner de consentimento de cookies encontrado ou falha ao fechá-lo." );
        }

        while ( true ) {
            await driver.wait( until.elementLocated( By.css( ".ui-search-results" ) ) );

            await getItemPrices( driver, products );

            const nextButton = await driver.findElements( By.css( ".andes-pagination__button--next" ) );
            if ( nextButton.length === 0 ) {
                console.log( "Nenhum botão próximo encontrado" );
                break;
            }
            const isDisabled = await nextButton[0].getAttribute( "class" ).then( classes => classes.includes( "andes-pagination__button--disabled" ) );
            if ( isDisabled ) {
                console.log( "Não há mais páginas para raspar" );
                break;
            }
            await nextButton[0].click();
        }

        products.sort( ( a, b ) => {
            const priceA = getProductPrice( a );
            const priceB = getProductPrice( b );

            return priceA - priceB;
        } );

        const productsText = products
            .map((product) => {
            if (!product.link) {
                return;
            }
            const productPrice = new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
            }).format(getProductPrice(product));

            if (product.hasDiscount) {
                const productOriginalPrice = new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                }).format(getProductOriginalPrice(product));

                return `Price (discount - ${getDiscountPercentage(
                    getProductPrice(product),
                    getProductOriginalPrice(product)
                )}): ${productPrice}, Original Price: ${productOriginalPrice}, Link: ${
                    product.link
                }`;
            }

            return `Price: ${productPrice}, Link: ${product.link}`;
        })
        .join('\n');

        fs.writeFileSync( `produtos-minerados.txt`, productsText );

        const endScrapingTime = process.hrtime( startScrapingTime );
        console.log(
            `A raspagem levou ${endScrapingTime[0]} segundos e ${
                endScrapingTime[1] / 1e6
            } milissegundos e recuperou ${
                products.length
            } produtos. Confira o arquivo produtos-mineirados.txt para mais informações.`
        );

        return products;
    } catch ( error ) {
        imprimeErro( error );
        throw error;
    } finally {
        if ( driver ) {
            await driver.quit();
        }
    }
}