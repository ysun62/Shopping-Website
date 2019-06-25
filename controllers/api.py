# This function gets logged in user from the database and passes it to "default_index.js"
def get_logged_in_user():
    user = None if auth.user is None else auth.user.email
    return response.json(dict(user=user))

@auth.requires_login()
def get_cart_size():
    cart = db(db.shopping_cart.user_email == auth.user.email).select()
    size = 0
    if cart:
        for p in cart:
            size += 1
            
    return response.json(dict(size=size))

@auth.requires_login()
def get_cart_product_id():
    cart = db(db.shopping_cart.user_email == auth.user.email).select()
    return response.json(dict(cart=cart))

@auth.requires_login()
def get_cart():
    cart = db(db.shopping_cart.user_email == auth.user.email).select()
    cartTotal = 0
    for c in cart:
        prod = db(db.product.id == c.product_id).select().first()
        c.name = prod.name
        c.price = prod.price
        c.description = prod.description
        
        num =  db((db.shopping_cart.product_id == c.product_id) & (db.shopping_cart.user_email == auth.user.email)).select().first()
        # if c.buyQuantity is not None:    
        c.buyQuantity = num.order_number
        cartTotal += int(c.price) * int(c.buyQuantity)
    return response.json(dict(cart=cart, cartTotal=cartTotal))


# This function gets each product from the database and passes it to "default_index.js"
def get_product_list():
    # Get all the products
    products = db(db.product).select()
    # Get the average for each product
    
    for p in products:
        sum = 0                            
        if auth.user is not None:
            num =  db((db.shopping_cart.product_id == p.id) & (db.shopping_cart.user_email == auth.user.email)).select().first()
            if num:
                p.buyQuantity = num.order_number

        reviews = db((db.review.product_id == p.id) & (db.review.rating > 0)).select()
        for r in reviews:
            sum += r.rating
        
        if len(reviews) == 0:
            p.avg = 0
        else:
            average = float(sum) / len(reviews) # A trick to use to turn average to float in Python 2
            p.avg = int(round(average)) # Rounding the average to the nearest integer

    return response.json(dict(products=products))

# This function gets yourReview from the database and passes it to "default_index.js"
@auth.requires_login()
def get_your_review():
    review = db((db.review.product_id == request.vars.product_id) & (db.review.user_email == request.vars.user_email)).select().first()
    return response.json(dict(review=review))

# This function gets yourReview from "default_index.js" and updates/inserts to the database
@auth.requires_login()
def save_review():
    db.review.update_or_insert(
        ((db.review.product_id == request.vars.product_id) & (db.review.user_email == request.vars.user_email)),
        body = request.vars.body, 
        product_id = request.vars.product_id,
        rating = request.vars.rating
    )    
    return "saved!"

# This function gets otherReview from the database and passes it to "default_index.js"
def get_other_reviews():
    if auth.user is None:
        other_reviews = db(db.review.product_id == request.vars.product_id).select()
    else:
        other_reviews = db((db.review.product_id == request.vars.product_id) & (db.review.user_email != auth.user.email)).select()
    return response.json(dict(other_reviews=other_reviews))

# This function gets clicked stars from "default_index.js" and updates/inserts to the database
@auth.requires_login()
def update_star():
    db.review.update_or_insert(
        ((db.review.product_id == request.vars.product_id) & (db.review.user_email == request.vars.user_email)),
        rating = request.vars.rating,
        product_id = request.vars.product_id
    )
    return "review"

@auth.requires_login()
def store_cart():
    db.shopping_cart.update_or_insert(
        ((db.shopping_cart.product_id == request.vars.product_id) & (db.shopping_cart.user_email == request.vars.email)),
        order_number = request.vars.buyNum,
        product_id = request.vars.product_id,
        already_present = request.vars.already_present
    )
    return "stored"

# @auth.requires_login()
# def store_cart_number():
#     db.shopping_cart.update_or_insert(
#         ((db.shopping_cart.user_email == request.vars.email) & (db.shopping_cart.product_id == request.vars.product_id)),
#         product_id = request.vars.product_id,
#         already_present = request.vars.already_present
#     )
#     return "ai"

@auth.requires_login()
def remove_product():
    db((db.shopping_cart.user_email == request.vars.email) & (db.shopping_cart.product_id == request.vars.product_id)).delete()
    print("removed")

@auth.requires_login()
def remove_all():
    db(db.shopping_cart.user_email == request.vars.email).delete()
