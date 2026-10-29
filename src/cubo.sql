-- Cubo mensual por estado y categoría principal de la orden.
-- Cada orden se asigna a la categoría de su ítem de mayor valor, así sumar celdas nunca duplica órdenes.
with items as (
    select
        i.order_id,
        coalesce(t.product_category_name_english, 'unknown') as categoria,
        i.price,
        i.freight_value
    from read_csv('{data}/olist_order_items_dataset.csv', header = true) i
    left join read_csv('{data}/olist_products_dataset.csv', header = true) p using (product_id)
    left join read_csv('{data}/product_category_name_translation.csv', header = true) t using (product_category_name)
),
por_orden as (
    select
        order_id,
        arg_max(categoria, price) as categoria,
        sum(price)                as productos,
        sum(freight_value)        as flete,
        count(*)                  as items
    from items
    group by 1
),
resenas as (
    select order_id, review_score
    from read_csv('{data}/olist_order_reviews_dataset.csv', header = true)
    qualify row_number() over (partition by order_id order by review_answer_timestamp desc) = 1
),
ordenes as (
    select
        strftime(o.order_purchase_timestamp, '%Y-%m') as mes,
        c.customer_state as estado,
        p.categoria,
        p.productos,
        p.flete,
        p.items,
        o.order_delivered_customer_date > o.order_estimated_delivery_date as tarde,
        r.review_score
    from read_csv('{data}/olist_orders_dataset.csv', header = true) o
    join read_csv('{data}/olist_customers_dataset.csv', header = true) c using (customer_id)
    join por_orden p using (order_id)
    left join resenas r using (order_id)
    where o.order_status = 'delivered'
      and o.order_purchase_timestamp >= '2017-01-01'
      and o.order_purchase_timestamp <  '2018-09-01'
)
select
    mes,
    estado,
    categoria,
    count(*)                                   as ordenes,
    round(sum(productos + flete), 2)           as facturacion,
    round(sum(flete), 2)                       as flete,
    sum(items)                                 as items,
    count(*) filter (where tarde)              as tarde,
    count(review_score)                        as resenas,
    sum(review_score)                          as nota_suma
from ordenes
group by all
order by mes, estado, categoria
