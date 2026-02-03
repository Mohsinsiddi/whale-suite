/**
 * Anoncoin Token Creation API
 * Proxies requests to Anoncoin API for anonymous token creation on Solana mainnet
 *
 * @see https://anoncoin.it
 */

import { NextRequest, NextResponse } from 'next/server';
import { Connection } from '@solana/web3.js';
import { v2 as cloudinary } from 'cloudinary';

const ANONCOIN_API_URL = process.env.ANONCOIN_API_URL || 'https://api.dubdub.tv';
const ANONCOIN_API_KEY = process.env.ANONCOIN_API_KEY;
const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload image to Cloudinary and return URL
 * Ensures image is viewable (not download) with proper dimensions
 */
async function uploadToCloudinary(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString('base64');
  const dataUri = `data:${file.type};base64,${base64}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: 'whale-suite/tokens',
    resource_type: 'image',
    format: 'png', // Force PNG format for consistent viewing
    unique_filename: true,
  });

  console.log('[Cloudinary] Uploaded:', result.secure_url);
  console.log('[Cloudinary] Width:', result.width, 'Height:', result.height);
  console.log('[Cloudinary] Format:', result.format);

  // Construct a viewable URL with transformations
  // fl_lossy ensures it's served as viewable image, not download
  // Adding .png extension ensures proper content-type
  const publicId = result.public_id;
  const viewableUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/w_512,h_512,c_fill,f_png/${publicId}.png`;

  console.log('[Cloudinary] Viewable URL:', viewableUrl);

  return viewableUrl;
}

interface AnoncoinResponse {
  status: 'success' | 'failed';
  message: string;
  data: {
    mintAddress: string;
    signedTransaction: string;
    blockhash: string;
    lastValidBlockHeight: number;
    blockhashExpiresInSeconds: number;
  } | null;
  error_code?: number | null;
  request_id: string;
}

/**
 * POST - Create a new token via Anoncoin API
 */
export async function POST(request: NextRequest) {
  try {
    if (!ANONCOIN_API_KEY) {
      return NextResponse.json(
        { error: 'Anoncoin API key not configured' },
        { status: 500 }
      );
    }

    // Get the form data from the request
    const incomingFormData = await request.formData();

    // Log what we're receiving (for debugging)
    console.log('[Anoncoin API] Creating token with:', {
      tickerName: incomingFormData.get('tickerName'),
      tickerSymbol: incomingFormData.get('tickerSymbol'),
      description: incomingFormData.get('description'),
      hasImage: incomingFormData.has('files'),
      royaltyUser: incomingFormData.get('royaltyUser'),
    });

    // Rebuild FormData to ensure proper format
    const formData = new FormData();
    formData.append('tickerName', incomingFormData.get('tickerName') as string);
    formData.append('tickerSymbol', incomingFormData.get('tickerSymbol') as string);
    formData.append('description', incomingFormData.get('description') as string);

    // Add optional fields
    const twitterLink = incomingFormData.get('twitterLink');
    if (twitterLink) formData.append('twitterLink', twitterLink as string);

    const telegramLink = incomingFormData.get('telegramLink');
    if (telegramLink) formData.append('telegramLink', telegramLink as string);

    const royaltyUser = incomingFormData.get('royaltyUser');
    if (royaltyUser) formData.append('royaltyUser', royaltyUser as string);

    // Upload image to Cloudinary first, then pass URL to Anoncoin
    const imageFile = incomingFormData.get('files') as File | null;
    if (imageFile) {
      console.log('[Anoncoin API] Image file:', imageFile.name, imageFile.type, imageFile.size);

      try {
        // Upload to Cloudinary
        const imageUrl = await uploadToCloudinary(imageFile);
        console.log('[Anoncoin API] Using imageUrl:', imageUrl);
        formData.append('imageUrl', imageUrl);
      } catch (uploadError) {
        console.error('[Anoncoin API] Cloudinary upload failed:', uploadError);
        return NextResponse.json(
          {
            error: 'Failed to upload image',
            details: uploadError instanceof Error ? uploadError.message : 'Unknown error',
          },
          { status: 500 }
        );
      }
    } else {
      console.log('[Anoncoin API] No image file provided');
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    // Forward to Anoncoin API
    console.log('[Anoncoin API] Calling:', `${ANONCOIN_API_URL}/thirdParty/v1/createToken`);

    // Log what we're sending to Anoncoin
    console.log('[Anoncoin API] FormData contents:');
    const entries = Array.from(formData.entries());
    entries.forEach(([key, value]) => {
      console.log(`  ${key}:`, typeof value === 'string' ? value : `[${typeof value}]`);
    });

    const response = await fetch(`${ANONCOIN_API_URL}/thirdParty/v1/createToken`, {
      method: 'POST',
      headers: {
        'x-api-key': ANONCOIN_API_KEY,
      },
      body: formData,
    });

    console.log('[Anoncoin API] Response status:', response.status, response.statusText);

    // Check if response is OK
    if (!response.ok) {
      const text = await response.text();
      console.error('[Anoncoin API] Error response:', text.substring(0, 500));

      // Check if it's HTML (error page)
      if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
        return NextResponse.json(
          {
            error: 'Anoncoin API returned an error page',
            details: `API returned ${response.status} ${response.statusText}. The service might be down or the API key may be invalid.`,
          },
          { status: 502 }
        );
      }

      // Try to parse JSON error response from Anoncoin
      try {
        const errorData = JSON.parse(text);
        if (errorData.message) {
          return NextResponse.json(
            {
              error: errorData.message,
              errorCode: errorData.errorCode,
              requestId: errorData.requestId,
            },
            { status: response.status }
          );
        }
      } catch {
        // Not JSON, return raw text
      }

      return NextResponse.json(
        {
          error: 'Anoncoin API error',
          details: text.substring(0, 200),
        },
        { status: response.status }
      );
    }

    // Try to parse JSON
    const responseText = await response.text();
    let data: AnoncoinResponse;

    try {
      data = JSON.parse(responseText);
    } catch {
      console.error('[Anoncoin API] JSON parse error:', responseText.substring(0, 500));
      return NextResponse.json(
        {
          error: 'Invalid response from Anoncoin API',
          details: 'API returned non-JSON response',
        },
        { status: 502 }
      );
    }

    console.log('[Anoncoin API] Response:', {
      status: data.status,
      message: data.message,
      mintAddress: data.data?.mintAddress,
      hasSignedTx: !!data.data?.signedTransaction,
    });

    if (data.status === 'failed') {
      return NextResponse.json(
        {
          error: data.message || 'Token creation failed',
          errorCode: data.error_code,
          requestId: data.request_id,
        },
        { status: 400 }
      );
    }

    // If we have a signed transaction, broadcast it to Solana
    if (data.data?.signedTransaction) {
      try {
        const connection = new Connection(SOLANA_RPC, 'confirmed');

        // Decode the base58 signed transaction
        const bs58 = await import('bs58');
        const txBuffer = bs58.default.decode(data.data.signedTransaction);

        // Send the transaction
        const signature = await connection.sendRawTransaction(txBuffer, {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        });

        console.log('[Anoncoin API] Transaction sent:', signature);

        // Wait for confirmation
        const confirmation = await connection.confirmTransaction({
          signature,
          blockhash: data.data.blockhash,
          lastValidBlockHeight: data.data.lastValidBlockHeight,
        }, 'confirmed');

        if (confirmation.value.err) {
          console.error('[Anoncoin API] Transaction failed:', confirmation.value.err);
          return NextResponse.json(
            {
              error: 'Transaction failed on-chain',
              details: confirmation.value.err,
            },
            { status: 500 }
          );
        }

        console.log('[Anoncoin API] Token created successfully!');
        console.log('[Anoncoin API] Mint Address:', data.data.mintAddress);
        console.log('[Anoncoin API] TX Signature:', signature);

        return NextResponse.json({
          success: true,
          mintAddress: data.data.mintAddress,
          signature,
          message: 'Token created successfully!',
          links: {
            dexscreener: `https://dexscreener.com/solana/${data.data.mintAddress}`,
            jupiter: `https://jup.ag/swap?sell=So11111111111111111111111111111111111111112&buy=${data.data.mintAddress}`,
            anoncoin: `https://anoncoin.it/${formData.get('tickerSymbol')}`,
            solscan: `https://solscan.io/token/${data.data.mintAddress}`,
          },
        });
      } catch (txError) {
        console.error('[Anoncoin API] Transaction broadcast error:', txError);
        return NextResponse.json(
          {
            error: 'Failed to broadcast transaction',
            details: txError instanceof Error ? txError.message : 'Unknown error',
            // Still return mint address in case user wants to retry
            mintAddress: data.data.mintAddress,
          },
          { status: 500 }
        );
      }
    }

    // If validateOnly was true or no signed transaction
    return NextResponse.json({
      success: true,
      mintAddress: data.data?.mintAddress,
      message: data.message,
      validated: true,
    });

  } catch (error) {
    console.error('[Anoncoin API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create token',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Health check
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'anoncoin-token-launcher',
    apiConfigured: !!ANONCOIN_API_KEY,
  });
}
