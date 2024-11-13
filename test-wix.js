import wixService from './services/wixService.js';
import { handleGetOrders } from './handlers/get_orders.js';
import { handleChangeFulfillmentStatus } from './handlers/change_fulfillment_status.js';
import { handleCloseRestaurant } from './handlers/close_restaurant.js';
import { handleOpenRestaurant } from './handlers/open_restaurant.js';
import { handleSetItemOutOfStock } from './handlers/set_item_out_of_stock.js';

async function main() {
    try {
        // Test get orders
   /*     console.log('\nTesting get orders:');
        try {
            const orders = await handleGetOrders();
            console.log('Orders:', orders);
        } catch (error) {
            console.error('Error getting orders:', error);
        }

        // Test change fulfillment status
        console.log('\nTesting change fulfillment status:');
        try {
            const orderId = "65d4c2c4-0c7c-4a3c-8519-00c5ce4460a6";
            const status = "Accepted";
            const result = await handleChangeFulfillmentStatus(orderId, status);
            console.log('Change status result:', result);
        } catch (error) {
            console.error('Error changing status:', error);
        }

        // Test close restaurant
        console.log('\nTesting close restaurant:');
        try {
            const closeResult = await handleCloseRestaurant();
            console.log('Close restaurant result:', JSON.stringify(closeResult, null, 2));
        } catch (error) {
            console.error('Error closing restaurant:', error);
        }

        // Test open restaurant
        console.log('\nTesting open restaurant:');
        try {
            const openResult = await handleOpenRestaurant();
            console.log('Open restaurant result:', JSON.stringify(openResult, null, 2));
        } catch (error) {
            console.error('Error opening restaurant:', error);
        }
*/
        // Test set item out of stock
        console.log('\nTesting set item out of stock:');
        try {
            const itemName = "Fish of the day";
            const setStockResult = await handleSetItemOutOfStock(itemName);
            console.log('Set item out of stock result:', JSON.stringify(setStockResult, null, 2));
        } catch (error) {
            console.error('Error setting item out of stock:', error);
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

main(); 