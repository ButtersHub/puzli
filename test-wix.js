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

async function testChangeOrderFulfillment() {
    try {
        // You can replace these with actual order IDs from your system
        const testOrderId = "7748f05f-261b-4238-b1e1-94a1263743ed";
        const newStatus = "Ready"; // or "Pending", "Accepted", "In_Delivery"

        console.log(`Attempting to change order ${testOrderId} to status ${newStatus}...`);
        
        const result = await wixService.changeOrderFulfillment(testOrderId, newStatus);
        
        console.log('Change fulfillment result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Test failed:', error.message);
        if (error.response) {
            console.error('Error response:', error.response.data);
        }
    }
}

async function runTests() {
    // Existing tests
    // await testGetPendingOrders();
    // await testGetAcceptedOrders();
    // await testGetReadyOrders();
    // await testGetOutForDeliveryOrders();
    // await testGetOrders();
    
    // New test
    await testChangeOrderFulfillment();
}

runTests(); 