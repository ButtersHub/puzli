import fetch from 'node-fetch';

export async function handleSetItemOutOfStock(itemName) {
    try {
        // 1. Get all menu items
        const getAllItemsResponse = await fetch('https://www.wixapis.com/restaurants/menus-item/v1/items', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': process.env.WIX_API_KEY,
                'wix-account-id': process.env.WIX_ACCOUNT_ID,
                'wix-site-id': process.env.WIX_SITE_ID
            }
        });

        const allItems = await getAllItemsResponse.json();
        console.log('All menu items:', allItems);

        // 2. Find the item by name
        const item = allItems.items.find(item => 
            item.name.toLowerCase() === itemName.toLowerCase()
        );

        if (!item) {
            throw new Error(`Menu item "${itemName}" not found`);
        }

        // 3. Update the item's stock status
        const updateResponse = await fetch(`https://www.wixapis.com/restaurants/menus-item/v1/items/${item.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': process.env.WIX_API_KEY,
                'wix-account-id': process.env.WIX_ACCOUNT_ID,
                'wix-site-id': process.env.WIX_SITE_ID
            },
            body: JSON.stringify({
                item: {
                    id: item.id,
                    revision: item.revision,
                    name: item.name,
                    description: item.description,
                    priceInfo: item.priceInfo,
                    image: item.image,
                    additionalImages: item.additionalImages,
                    labels: item.labels,
                    visible: item.visible,
                    orderSettings: {
                        ...item.orderSettings,
                        inStock: false
                    },
                    modifierGroups: item.modifierGroups
                }
            })
        });

        const result = await updateResponse.json();
        
        return {
            message: `Successfully set "${itemName}" as out of stock`,
            itemId: item.id,
            success: true,
            result
        };

    } catch (error) {
        console.error('Error setting item out of stock:', error);
        return {
            success: false,
            error: error.message
        };
    }
} 