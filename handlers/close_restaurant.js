import wixService from '../services/wixService.js';
import fetch from 'node-fetch';

export async function handleCloseRestaurant() {
    try {
        // 1. Query all fulfillment methods
        const queryResponse = await fetch('https://www.wixapis.com/fulfillment-methods/v1/fulfillment-methods/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': process.env.WIX_API_KEY,
                'wix-account-id': process.env.WIX_ACCOUNT_ID,
                'wix-site-id': process.env.WIX_SITE_ID
            },
            body: JSON.stringify({})
        });

        const fulfillmentMethods = await queryResponse.json();
        console.log('Current fulfillment methods:', fulfillmentMethods);

        // 2. Update each fulfillment method to disabled
        const updatePromises = fulfillmentMethods.fulfillmentMethods.map(async method => {
            try {
                const updateResponse = await fetch(`https://www.wixapis.com/fulfillment-methods/v1/fulfillment-methods/${method.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': process.env.WIX_API_KEY,
                        'wix-account-id': process.env.WIX_ACCOUNT_ID,
                        'wix-site-id': process.env.WIX_SITE_ID
                    },
                    body: JSON.stringify({
                        fulfillmentMethod: {
                            id: method.id,
                            revision: method.revision,
                            enabled: false
                        }
                    })
                });

                const result = await updateResponse.json();
                return {
                    methodId: method.id,
                    success: true,
                    result
                };
            } catch (error) {
                console.error(`Error updating fulfillment method ${method.id}:`, error);
                return {
                    methodId: method.id,
                    success: false,
                    error: error.message
                };
            }
        });

        const results = await Promise.all(updatePromises);

        return {
            message: 'Restaurant closed - all fulfillment methods disabled',
            totalMethods: fulfillmentMethods.fulfillmentMethods.length,
            results: results
        };

    } catch (error) {
        console.error('Error closing restaurant:', error);
        throw new Error('Failed to close restaurant: ' + error.message);
    }
} 