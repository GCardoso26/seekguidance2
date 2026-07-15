# SUBSCRIPTIONS.md

Plans (independent of role):

`FREE | PRO | SELLER_STARTER | SELLER_PRO | ENTERPRISE`

Subject types: `user | company | store`.

Table: `platform_subscriptions`.  

RC1 projection: `stores.subscription_plan` (`free|lojista|pro|enterprise`) → plan enum via adapter — **does not remove** legacy columns.
