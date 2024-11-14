import wixService from '../services/wixService.js';
import axios from 'axios';

async function getAreaBoundaries(areaName, countryCode = '') {
    try {
        const countryParam = countryCode ? `&countrycodes=${countryCode}` : '';
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            areaName
        )}${countryParam}&format=json&polygon_geojson=1`;

        const response = await axios.get(nominatimUrl, {
            headers: {
                'User-Agent': 'AreaBoundaryFetcher/1.0',
                'Accept-Language': 'en'
            }
        });

        if (!response.data || response.data.length === 0) {
            throw new Error(`Area "${areaName}"${countryCode ? ` in ${countryCode}` : ''} not found`);
        }

        const areaData = response.data[0];
        const geoJson = areaData.geojson;

        if (!geoJson || !geoJson.coordinates || geoJson.coordinates.length === 0) {
            throw new Error(`No boundary data found for "${areaName}"${countryCode ? ` in ${countryCode}` : ''}`);
        }

        // Handle different types of GeoJSON geometries
        if (geoJson.type === 'MultiPolygon') {
            // Return array of coordinate arrays
            return geoJson.coordinates.map(polygon => polygon[0]);
        } else {
            // Return single coordinate array for Polygon type
            return geoJson.coordinates[0];
        }
    } catch (error) {
        console.error('Error fetching area boundaries:', error);
        throw error;
    }
}

export async function handleChangeDeliveryArea(params) {
    try {
        const { areas } = params;
        console.log('Setting delivery areas to:', areas);

        // First, fetch current fulfillment method
        console.log('Fetching current fulfillment method...');
        const currentFulfillment = await axios.get(
            'https://www.wixapis.com/fulfillment-methods/v1/fulfillment-methods/12590791-d0d9-418f-a226-a7dcfd37b507',
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': process.env.WIX_API_KEY,
                    'wix-account-id': process.env.WIX_ACCOUNT_ID,
                    'wix-site-id': process.env.WIX_SITE_ID
                }
            }
        );

        console.log('Current fulfillment revision:', currentFulfillment.data.fulfillmentMethod.revision);

        // Get boundaries for the first area
        console.log('Fetching boundaries for:', areas[0]);
        const coordinates = await getAreaBoundaries(areas[0], 'IL');
        console.log('Got coordinates:', coordinates.length, 'points');

        // Convert coordinates to Wix format
        const geocodes = coordinates.map(coord => ({
            latitude: coord[1],
            longitude: coord[0]
        }));

        // Prepare the fulfillment method update using current data
        const fulfillmentMethod = {
            ...currentFulfillment.data.fulfillmentMethod,
            deliveryOptions: {
                ...currentFulfillment.data.fulfillmentMethod.deliveryOptions,
                deliveryArea: {
                    type: "CUSTOM",
                    customOptions: {
                        geocodes: geocodes
                    }
                }
            }
        };

        console.log('Sending update request to Wix...');

        // Call Wix API to update
        const response = await axios.patch(
            'https://www.wixapis.com/fulfillment-methods/v1/fulfillment-methods/12590791-d0d9-418f-a226-a7dcfd37b507',
            { fulfillmentMethod },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': process.env.WIX_API_KEY,
                    'wix-account-id': process.env.WIX_ACCOUNT_ID,
                    'wix-site-id': process.env.WIX_SITE_ID
                }
            }
        );

        return {
            success: true,
            message: `Successfully updated delivery area to: ${areas[0]}`,
            data: response.data
        };

    } catch (error) {
        console.error('Error updating delivery area:', error);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
        }
        return {
            success: false,
            error: error.message,
            details: error.response?.data
        };
    }
} 