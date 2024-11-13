import wixService from './services/wixService.js';

async function testAllOrders() {
    try {
        const allOrders = await wixService.getOrders();
        console.log('All orders summary:');
        console.log('Pending orders:', allOrders.pending.length);
        console.log('Accepted orders:', allOrders.accepted.length);
        console.log('Ready orders:', allOrders.ready.length);
        console.log('In Delivery orders:', allOrders.inDelivery.length);
        
        // If you want to see the full data
        console.log('\nFull orders data:', JSON.stringify(allOrders, null, 2));
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testAllOrders(); 