export const get_orders = {
    name: "get_orders",
    description: "Retrieves all orders from Wix, organized by their fulfillment status (pending, accepted, ready, and in delivery). Returns detailed order information including delivery times, shipping info, and line items.",
    parameters: {
        type: "object",
        properties: {},  // No parameters needed
        required: []
    }
}; 