export async function handleGetOrdersMock() {
    return {
        pending: [
            {
                id: "p1",
                number: "1001",
                deliveryTimeSlotFromDate: "2024-11-12T10:00:00.000Z",
                deliveryTimeSlotToDate: "2024-11-12T12:00:00.000Z",
                shippingInfo: {
                    title: "Downtown Area",
                    address: {
                        street: "123 Main St",
                        city: "Sample City"
                    }
                },
                lineItems: [
                    {
                        name: "Chicken Salad",
                        quantity: 2
                    }
                ]
            },
            {
                id: "p2",
                number: "1002",
                deliveryTimeSlotFromDate: "2024-11-12T14:00:00.000Z",
                deliveryTimeSlotToDate: "2024-11-12T16:00:00.000Z",
                shippingInfo: {
                    title: "Uptown Area",
                    address: {
                        street: "456 Oak St",
                        city: "Sample City"
                    }
                },
                lineItems: [
                    {
                        name: "Beef Stir Fry",
                        quantity: 1
                    }
                ]
            }
        ],
        accepted: [
            {
                id: "a1",
                number: "1003",
                deliveryTimeSlotFromDate: "2024-11-12T11:00:00.000Z",
                deliveryTimeSlotToDate: "2024-11-12T13:00:00.000Z",
                shippingInfo: {
                    title: "Midtown Area",
                    address: {
                        street: "789 Pine St",
                        city: "Sample City"
                    }
                },
                lineItems: [
                    {
                        name: "Vegetable Soup",
                        quantity: 3
                    }
                ]
            }
        ],
        ready: [
            {
                id: "r1",
                number: "1004",
                deliveryTimeSlotFromDate: "2024-11-12T12:00:00.000Z",
                deliveryTimeSlotToDate: "2024-11-12T14:00:00.000Z",
                shippingInfo: {
                    title: "West Side",
                    address: {
                        street: "321 Elm St",
                        city: "Sample City"
                    }
                },
                lineItems: [
                    {
                        name: "Pasta Carbonara",
                        quantity: 2
                    }
                ]
            }
        ],
        inDelivery: [
            {
                id: "d1",
                number: "1005",
                deliveryTimeSlotFromDate: "2024-11-12T13:00:00.000Z",
                deliveryTimeSlotToDate: "2024-11-12T15:00:00.000Z",
                shippingInfo: {
                    title: "East Side",
                    address: {
                        street: "654 Maple St",
                        city: "Sample City"
                    }
                },
                lineItems: [
                    {
                        name: "Grilled Salmon",
                        quantity: 1
                    }
                ]
            }
        ]
    };
} 