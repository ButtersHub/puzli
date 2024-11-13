import wixService from '../services/wixService.js';

export async function handleGetOrders() {

    console.log("LEV -  Getting orders...");

    try {
        const orders = await wixService.getOrders();
        console.log("LEV -  Orders received:", orders);
        return orders;
    } catch (error) {
        console.error('Error in handleGetOrders:', error);
        throw error;
    }
} 