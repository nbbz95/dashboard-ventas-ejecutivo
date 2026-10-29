#!/usr/bin/env bash
# Descarga el dataset público de Olist (repo oficial olist/work-at-olist-data).
set -euo pipefail
cd "$(dirname "$0")/../data"
BASE=https://raw.githubusercontent.com/olist/work-at-olist-data/master/datasets
for f in olist_orders_dataset olist_order_items_dataset olist_customers_dataset olist_products_dataset \
         olist_sellers_dataset olist_order_payments_dataset olist_order_reviews_dataset product_category_name_translation; do
  [ -s "$f.csv" ] || curl -sSfL -o "$f.csv" "$BASE/$f.csv"
done
ls -la
