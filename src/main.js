/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
    // @TODO: Расчет выручки от операции

    const { discount , sale_price, quantity } = purchase;
    const revenue = sale_price * quantity * (1 - (discount / 100)); //Вообще хуй пойми, что мы тут делаем
    return revenue;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге

    const { profit } = seller;
    if (index === 0) {
        return profit * 0.15;
    } else if (index === 1 || index === 2) {
        return profit * 0.1;
    } else if (index === total - 1) {
        return 0;
    } else {
        return profit * 0.05;
    };
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных

    if (!options 
        || !Array.isArray(data.sellers)
        || data.sellers === 0
        || data.purchase_records.length === 0
    ) {
        throw new Error('Некорректные данные');
    };

    // @TODO: Проверка наличия опций
    
    const { calculateRevenue, calculateBonus } = options;

    if (!calculateBonus || !calculateRevenue) {
        throw new Error('Чего-то не хватает');
    };
    // @TODO: Подготовка промежуточных данных для сбора статистики

    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    })); 
    // @TODO: Индексация продавцов и товаров для быстрого доступа

    const sellerIndex = Object.fromEntries(sellerStats.map(item => [item.id, item]));

    const productIndex =  Object.fromEntries(data.products.map(item => [item.sku, item]));

    // @TODO: Расчет выручки и прибыли для каждого продавца

    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        seller.sales_count += 1;
        seller.revenue += record.total_amount;
        
        record.items.forEach(item => {
            const product = productIndex[item.sku];

            const cost = product.purchase_price * item.quantity;
            const revenue = calculateSimpleRevenue(item, product);
            const profit = revenue - cost;
            seller.profit += profit;

            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            };

            seller.products_sold[item.sku] += 1;

        });
    });
    // @TODO: Сортировка продавцов по прибыли

    sellerStats.sort((a, b) => {
        return b.profit - a.profit;
    });

    // @TODO: Назначение премий на основе ранжирования

    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonusByProfit(index, sellerStats.length, seller);
        seller.top_products = Object.entries(seller.products_sold).sort((a, b) => {
        return b[1] - a[1];
        }).slice(0, 10);
    });

    // console.log(sellerStats);

    // @TODO: Подготовка итоговой коллекции с нужными полями

    return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: +seller.bonus.toFixed(2)
    }));
}