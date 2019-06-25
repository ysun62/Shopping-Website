def get_user_email():
    return None if auth.user is None else auth.user.email

def get_name():
    return None if auth.user is None else auth.user.first_name + ' ' + auth.user.last_name

db.define_table('product',
    Field('name'),
    Field('description'),
    Field('price'),
    Field('buyQuantity'),
    Field('alreadyPresent', default = False)
)

db.define_table('review',
    Field('user_email', default = get_user_email()),
    Field('product_id', 'reference product'),
    Field('body', 'text'),
    Field('rating', 'integer', default = 0),
    Field('name', default = get_name()),
    Field('average', 'integer', default = 0)
)

db.define_table('shopping_cart',
    Field('order_number', 'integer'),
    Field('product_id', 'reference product'),
    Field('user_email', default = get_user_email),
    Field('already_present', default = False)
)

db.product.id.readable = db.product.id.writable = False
db.product.buyQuantity.readable = db.product.buyQuantity.writable = False
db.product.alreadyPresent.readable = db.product.alreadyPresent.writable = False