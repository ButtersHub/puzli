import wixService from '../services/wixService.js';

export async function handleChangeFulfillmentStatus(orderId, status) {
    try {
        const result = await wixService.changeOrderFulfillment(orderId, status);
        return result;
    } catch (error) {
        console.error('Error changing fulfillment status:', error);
        throw error;
    }
} 