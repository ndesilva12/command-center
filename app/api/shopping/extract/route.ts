import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface ProductData {
  url: string;
  title: string;
  description: string;
  imageUrl?: string;
  price?: string;
  currency?: string;
  category?: string;
  brand?: string;
  availability?: string;
}

/**
 * Extract product information from e-commerce URLs
 * Supports: Amazon, eBay, Etsy, Shopify stores, and generic Open Graph metadata
 */
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || !url.trim()) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    console.log(`[Shopping Extract] Processing: ${url}`);

    try {
      // Fetch the page
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: 15000,
        maxRedirects: 5,
      });

      const html = response.data;
      const $ = cheerio.load(html);

      const productData: ProductData = {
        url,
        title: '',
        description: '',
      };

      // Domain-specific extractors
      const hostname = parsedUrl.hostname.toLowerCase();

      if (hostname.includes('amazon.com')) {
        productData.title = $('#productTitle').text().trim() || 
                           $('h1 span#productTitle').text().trim();
        productData.description = $('#feature-bullets ul li span.a-list-item').first().text().trim() ||
                                 $('#productDescription p').first().text().trim();
        productData.imageUrl = $('#landingImage').attr('src') || 
                              $('#imgBlkFront').attr('src') ||
                              $('img[data-a-image-name="landingImage"]').attr('src');
        productData.price = $('.a-price .a-offscreen').first().text().trim() ||
                           $('#priceblock_ourprice').text().trim() ||
                           $('#priceblock_dealprice').text().trim();
        productData.brand = $('#bylineInfo').text().replace('Brand:', '').replace('Visit the', '').replace('Store', '').trim();
        productData.availability = $('#availability span').text().trim();
      } 
      else if (hostname.includes('ebay.com')) {
        productData.title = $('h1.x-item-title__mainTitle').text().trim() ||
                           $('.it-ttl').text().trim();
        productData.description = $('.vi-desc-content').first().text().trim() ||
                                 $('#viTabs_0_panel p').first().text().trim();
        productData.imageUrl = $('#icImg').attr('src') ||
                              $('img.vi-image-gallery__image').first().attr('src');
        productData.price = $('.x-price-primary span').first().text().trim() ||
                           $('#prcIsum').text().trim();
      }
      else if (hostname.includes('etsy.com')) {
        productData.title = $('h1[data-buy-box-listing-title]').text().trim() ||
                           $('.wt-text-body-01').first().text().trim();
        productData.description = $('[data-product-details-description-text-content]').text().trim() ||
                                 $('.wt-text-body-01.wt-break-word').first().text().trim();
        productData.imageUrl = $('img[data-component="listing-page-image-carousel"]').first().attr('src') ||
                              $('.carousel-pane img').first().attr('src');
        productData.price = $('[data-buy-box-region="price"]').text().trim() ||
                           $('.wt-text-title-03').first().text().trim();
      }

      // Fallback to Open Graph and meta tags
      if (!productData.title) {
        productData.title = $('meta[property="og:title"]').attr('content') ||
                           $('meta[name="twitter:title"]').attr('content') ||
                           $('h1').first().text().trim() ||
                           $('title').text().trim();
      }

      if (!productData.description) {
        productData.description = $('meta[property="og:description"]').attr('content') ||
                                 $('meta[name="description"]').attr('content') ||
                                 $('meta[name="twitter:description"]').attr('content') ||
                                 $('p').first().text().trim();
      }

      if (!productData.imageUrl) {
        productData.imageUrl = $('meta[property="og:image"]').attr('content') ||
                              $('meta[name="twitter:image"]').attr('content') ||
                              $('img').first().attr('src');
      }

      // Try to extract price from structured data (schema.org)
      if (!productData.price) {
        $('script[type="application/ld+json"]').each((_, el) => {
          try {
            const json = JSON.parse($(el).html() || '{}');
            if (json['@type'] === 'Product' && json.offers) {
              const offers = Array.isArray(json.offers) ? json.offers[0] : json.offers;
              if (offers.price) {
                productData.price = `${offers.priceCurrency || '$'}${offers.price}`;
              }
            }
          } catch (e) {
            // Ignore JSON parse errors
          }
        });
      }

      // Clean up extracted data
      productData.title = productData.title.substring(0, 200).trim();
      productData.description = productData.description.substring(0, 500).trim();

      // Ensure we at least have a title
      if (!productData.title) {
        productData.title = parsedUrl.hostname;
      }

      // Clean up image URL (handle relative URLs)
      if (productData.imageUrl && !productData.imageUrl.startsWith('http')) {
        try {
          productData.imageUrl = new URL(productData.imageUrl, url).href;
        } catch {
          delete productData.imageUrl;
        }
      }

      // Attempt to categorize based on URL or content
      const urlPath = parsedUrl.pathname.toLowerCase();
      if (urlPath.includes('/clothing') || urlPath.includes('/apparel')) {
        productData.category = 'Clothing';
      } else if (urlPath.includes('/electronics') || urlPath.includes('/tech')) {
        productData.category = 'Electronics';
      } else if (urlPath.includes('/home') || urlPath.includes('/furniture')) {
        productData.category = 'Home';
      } else if (urlPath.includes('/books')) {
        productData.category = 'Books';
      } else if (urlPath.includes('/shoes') || urlPath.includes('/footwear')) {
        productData.category = 'Shoes';
      }

      console.log(`[Shopping Extract] Extracted:`, {
        title: productData.title,
        hasImage: !!productData.imageUrl,
        hasPrice: !!productData.price,
        hasDescription: !!productData.description,
      });

      return NextResponse.json({
        success: true,
        product: productData,
      });

    } catch (error: any) {
      console.error('[Shopping Extract] Scraping error:', error);

      // Return basic info if scraping fails
      return NextResponse.json({
        success: true,
        product: {
          url,
          title: parsedUrl.hostname,
          description: `Product from ${parsedUrl.hostname}`,
        },
        warning: 'Could not extract detailed product information',
      });
    }

  } catch (error: any) {
    console.error('[Shopping Extract] Request error:', error);
    return NextResponse.json(
      { error: 'Failed to extract product information' },
      { status: 500 }
    );
  }
}
