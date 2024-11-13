import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class WixService {
    constructor() {
        this.apiUrl = process.env.WIX_API_URL;
        this.apiKey = process.env.WIX_API_KEY;
        this.startOfToday = "2024-11-12T22:00:00.133Z";
    }

    async getPendingOrders() {
        try {
            const requestBody = {
                query: {
                    filter: {
                        $and: [
                            {
                                "lineItems.catalogReference.appId": {
                                    $eq: "9a5d83fd-8570-482e-81ab-cfa88942ee60"
                                }
                            },
                            {
                                archived: {
                                    $eq: false
                                }
                            },
                            {
                                status: {
                                    $in: ["APPROVED"]
                                }
                            },
                            {
                                $or: [
                                    {
                                        deliveryTimeSlotToDate: {
                                            $gte: this.startOfToday
                                        }
                                    },
                                    {
                                        $and: [
                                            {
                                                deliveryTimeSlotFromDate: {
                                                    $exists: false
                                                }
                                            },
                                            {
                                                deliveryTimeSlotToDate: {
                                                    $exists: false
                                                }
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                fulfillmentStatuses: {
                                    $eq: "Pending"
                                }
                            }
                        ]
                    },
                    sort: [
                        {
                            field_name: "deliveryTimeSlotFromDate",
                            order: "ASC"
                        },
                        {
                            field_name: "deliveryTimeSlotToDate",
                            order: "ASC"
                        },
                        {
                            field_name: "shippingInfo.title",
                            order: "ASC"
                        },
                        {
                            field_name: "number",
                            order: "ASC"
                        }
                    ],
                    paging: {
                        limit: 100
                    }
                }
            };

            const response = await axios.post(
                `${this.apiUrl}/ecom/v1/orders/query`, 
                requestBody,
                {
                    headers: {
                        'Authorization': this.apiKey,
                        'wix-account-id': process.env.WIX_ACCOUNT_ID,
                        'wix-site-id': process.env.WIX_SITE_ID,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error fetching pending orders from Wix:', error);
            throw error;
        }
    }

    async getAcceptedOrders() {
        try {
            const requestBody = {
                query: {
                    filter: {
                        $and: [
                            {
                                "lineItems.catalogReference.appId": {
                                    $eq: "9a5d83fd-8570-482e-81ab-cfa88942ee60"
                                }
                            },
                            {
                                archived: {
                                    $eq: false
                                }
                            },
                            {
                                status: {
                                    $in: ["APPROVED"]
                                }
                            },
                            {
                                $or: [
                                    {
                                        deliveryTimeSlotToDate: {
                                            $gte: this.startOfToday
                                        }
                                    },
                                    {
                                        $and: [
                                            {
                                                deliveryTimeSlotFromDate: {
                                                    $exists: false
                                                }
                                            },
                                            {
                                                deliveryTimeSlotToDate: {
                                                    $exists: false
                                                }
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                fulfillmentStatuses: {
                                    $eq: "Accepted"
                                }
                            }
                        ]
                    },
                    sort: [
                        {
                            field_name: "deliveryTimeSlotFromDate",
                            order: "ASC"
                        },
                        {
                            field_name: "deliveryTimeSlotToDate",
                            order: "ASC"
                        },
                        {
                            field_name: "shippingInfo.title",
                            order: "ASC"
                        },
                        {
                            field_name: "number",
                            order: "ASC"
                        }
                    ],
                    paging: {
                        limit: 100
                    }
                }
            };

            const response = await axios.post(
                `${this.apiUrl}/ecom/v1/orders/query`, 
                requestBody,
                {
                    headers: {
                        'Authorization': this.apiKey,
                        'wix-account-id': process.env.WIX_ACCOUNT_ID,
                        'wix-site-id': process.env.WIX_SITE_ID,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error fetching accepted orders from Wix:', error);
            throw error;
        }
    }

    async getReadyOrders() {
        try {
            const requestBody = {
                query: {
                    filter: {
                        $and: [
                            {
                                "lineItems.catalogReference.appId": {
                                    $eq: "9a5d83fd-8570-482e-81ab-cfa88942ee60"
                                }
                            },
                            {
                                archived: {
                                    $eq: false
                                }
                            },
                            {
                                status: {
                                    $in: ["APPROVED"]
                                }
                            },
                            {
                                $or: [
                                    {
                                        deliveryTimeSlotToDate: {
                                            $gte: this.startOfToday
                                        }
                                    },
                                    {
                                        $and: [
                                            {
                                                deliveryTimeSlotFromDate: {
                                                    $exists: false
                                                }
                                            },
                                            {
                                                deliveryTimeSlotToDate: {
                                                    $exists: false
                                                }
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                fulfillmentStatuses: {
                                    $eq: "Ready"
                                }
                            }
                        ]
                    },
                    sort: [
                        {
                            field_name: "deliveryTimeSlotFromDate",
                            order: "ASC"
                        },
                        {
                            field_name: "deliveryTimeSlotToDate",
                            order: "ASC"
                        },
                        {
                            field_name: "shippingInfo.title",
                            order: "ASC"
                        },
                        {
                            field_name: "number",
                            order: "ASC"
                        }
                    ],
                    paging: {
                        limit: 100
                    }
                }
            };

            const response = await axios.post(
                `${this.apiUrl}/ecom/v1/orders/query`, 
                requestBody,
                {
                    headers: {
                        'Authorization': this.apiKey,
                        'wix-account-id': process.env.WIX_ACCOUNT_ID,
                        'wix-site-id': process.env.WIX_SITE_ID,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error fetching ready orders from Wix:', error);
            throw error;
        }
    }

    async getOutForDeliveryOrders() {
        try {
            const requestBody = {
                query: {
                    filter: {
                        $and: [
                            {
                                "lineItems.catalogReference.appId": {
                                    $eq: "9a5d83fd-8570-482e-81ab-cfa88942ee60"
                                }
                            },
                            {
                                archived: {
                                    $eq: false
                                }
                            },
                            {
                                status: {
                                    $in: ["APPROVED"]
                                }
                            },
                            {
                                $or: [
                                    {
                                        deliveryTimeSlotToDate: {
                                            $gte: this.startOfToday
                                        }
                                    },
                                    {
                                        $and: [
                                            {
                                                deliveryTimeSlotFromDate: {
                                                    $exists: false
                                                }
                                            },
                                            {
                                                deliveryTimeSlotToDate: {
                                                    $exists: false
                                                }
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                fulfillmentStatuses: {
                                    $eq: "In_Delivery"
                                }
                            }
                        ]
                    },
                    sort: [
                        {
                            field_name: "deliveryTimeSlotFromDate",
                            order: "ASC"
                        },
                        {
                            field_name: "deliveryTimeSlotToDate",
                            order: "ASC"
                        },
                        {
                            field_name: "shippingInfo.title",
                            order: "ASC"
                        },
                        {
                            field_name: "number",
                            order: "ASC"
                        }
                    ],
                    paging: {
                        limit: 100
                    }
                }
            };

            const response = await axios.post(
                `${this.apiUrl}/ecom/v1/orders/query`, 
                requestBody,
                {
                    headers: {
                        'Authorization': this.apiKey,
                        'wix-account-id': process.env.WIX_ACCOUNT_ID,
                        'wix-site-id': process.env.WIX_SITE_ID,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error fetching out for delivery orders from Wix:', error);
            throw error;
        }
    }

    async getOrders() {
        try {
            // Call all order methods in parallel
            const [pending, accepted, ready, inDelivery] = await Promise.all([
                this.getPendingOrders(),
                this.getAcceptedOrders(),
                this.getReadyOrders(),
                this.getOutForDeliveryOrders()
            ]);

            // Aggregate the results
            return {
                pending: pending.orders || [],
                accepted: accepted.orders || [],
                ready: ready.orders || [],
                inDelivery: inDelivery.orders || []
            };
        } catch (error) {
            console.error('Error fetching all orders from Wix:', error);
            throw error;
        }
    }
}

export default new WixService(); 