/**
 * @author : Armel Andrianimanana <arbandry@gmail.com>
 */

 window.dataLayer = window.dataLayer || [];

 $(function () {
  /*ecommerce-tag-manager : Measuring Product Impressions*/
  imperessions();
  /*ecommerce-tag-manager : Measuring Product Clicks*/
  productClick();
  /*ecommerce-tag-manager : Measuring Views of Product Details*/
  productDetails();
  /*ecommerce-tag-manager : Measuring Additions from a Shopping Cart*/
  addToCartEcommerce();
  /*ecommerce-tag-manager : Measuring a Checkout and Measuring Purchases*/
  checkoutAndPurchase();
  /*ecommerce-tag-manager : Measuring Checkout Options*/
  onCheckoutOption();

}); 

 
/**
 * [manadio description]
 * @param  {[type]} data [description]
 * @return {[type]}      [description]
 */
function manadio(data){
  let data_final = parseFloat(data.replace(/[,€\s]/g, reg => {
      let reg_replace = ""; 
      switch(reg){
       case ",": reg_replace  = ".";break;
       case "€": reg_replace  = "";
       default: reg_replace   = "";break;
     }
     return reg_replace; 
   }));
  return data_final;
}

/**
 * [each_slice description]
 * @param  {[type]}   arr [description]
 * @param  {[type]}   num [description]
 * @param  {Function} fn  [description]
 * @return {[type]}       [description]
 */
function each_slice(arr, num, fn) {
  if(fn === undefined) fn = function(){};
  for(var i=0,l=arr.length,count=0,slice=[],ret=[]; i<l; i++) {
    if(count >= num) {
      fn.apply(slice);
      ret.push(slice);
      count=0, slice=[];
    }
    slice.push(arr[i]);
    count++;
  }
  if (slice.length > 0) {
    fn.apply(slice);
    ret.push(slice);
  }
  return ret;
}

/**
 * [getProduct description]
 * @param  {[type]} element       [description]
 * @param  {[type]} data_defaults [description]
 * @param  {String} selector      [description]
 * @return {[type]}               [description]
 */
function getProduct(element, data_defaults) {
  let datas     = $(element).data() || {};
  /*for price || promo*/
  $(element).find('[data-price]:first,[data-brand]:first,[data-id]').each(function(){
    let _datas = $(this).data();
    for(const data in _datas){ 
      if(data !== undefined || _datas[data] !== undefined){
          /* remove €  || replace "," to "." */
          if(data == "price" && _datas[data].toString().match(/[€]/g)){  
            let _price = manadio(_datas[data]);
          datas[data] =  _price;   
          }else{
            datas[data] = _datas[data];
          }
        }
      }
    });    
  /*insert default data*/
  for(const data in data_defaults)
    datas[data] = data_defaults[data];

  return cleanData(datas);
}


/**
 * [cleanData description]
 * @param  {[type]} datas [description]
 * @return {[type]}       [description]
 */
function cleanData(datas){
  let defaults = {};
  for( const data in datas){
    if(datas[data] == null || datas[data] == undefined){
      delete(datas[data]);
    }
    /*on exclus le data-show*/
    if(datas[data] !== "data-show" || data !== "show" )
      defaults[data] = datas[data];
  }
  return defaults;
}

/**
 * [imperessions description]
 * @return {[type]} [description]
 */
function imperessions(){
  let items = [];
  $('[data-list-name]').each(function(listIndex, listBox) {
    let page = $(listBox).data('page') || 1;
    let count_per_page = $(listBox).data('count-per-page') || 0;
    let product_box = $(listBox).find('.product-box');
    $(product_box).each(function(index, linkBox) {

      if($(this).attr("data-show") == undefined){          
        $(this).attr("data-show", "data-show");        
        if( $(this).attr("data-show") == "data-show"){
          let position = (page - 1) * count_per_page + index + 1;
          items.push( getProduct($(linkBox), {
            'list': $(listBox).data('list-name'),
            'position': position
          }));
        }
      } 
      
    });
  });

  if (items.length > 0) { 
    each_slice(items, 30, function() {
      dataLayer.push({
        'event': 'Impressions',
        'ecommerce': { 'currencyCode': 'EUR', 'impressions': items }
      });
    });
    /*ecommerce-tag-manager : Measuring Promotion Impressions*/
    promotionImpressions();
  }
}

/**
 * [productClick description]
 * @return {[type]} [description]
 */
function productClick(){    
  $('[data-list-name]').each(function(listIndex, listBox) {
    let page = $(listBox).data('page') || 1;
    let count_per_page = $(listBox).data('count-per-page') || 0;
    $(listBox).find('.product-box').each(function(index, linkBox) {
      let position = (page - 1) * count_per_page + index + 1;
      $(linkBox).on('click', function (evt) {
        let items = [];
        items.push( getProduct($(linkBox), {
          'position': position
        }));
        dataLayer.push({
          'event': 'productClick',
          'ecommerce': {
            'click': {
              'actionField': {
                'list': $(listBox).data('list-name')
              },
              'products': items
            }
          },
          'eventCallback': function(){
            document.location = $(linkBox).find('[data-link]:first').data('link')
          }
        });
        sessionStorage['productListName'] = $(listBox).data('list-name');
      });
    });
  });
}

/**
 * [productDetails description]
 * @return {[type]} [description]
 */
function productDetails(){
  let items = [];
  $('.product-detail-container').find('.product-detail').each(function(index, curent_element){
    items.push(getProduct($(curent_element)));
  });

  if(items.length > 0){
    dataLayer.push({
      'event': 'ProductDetail',
      'ecommerce': {
        'detail': {
          'actionField': {
            'list': sessionStorage['productListName']
          },
          'products': items
        }
      }
    });
  } 
}

/**
 * [addToCartEcommerce description]
 */
function addToCartEcommerce(){
  $('.add-to-cart').on('click', function(){
    let verify_elt_clicked = $(this).is('[id*=article_group_]'); 
    let items = [];

    if(verify_elt_clicked){
      let id_elt_clicked  = $(this).attr("id");   
      $(this).closest('.product-detail-container').find('.'+id_elt_clicked).each(function(){
        if($(this).hasClass('product-detail '+id_elt_clicked+'')){
          let quantity = $('input[class*='+id_elt_clicked+']').val();
          items.push(
            getProduct($(this), {'quantity': parseInt(quantity) })
          );
        }
      });
    }else{
      let elt_parent  = $(this).closest('.product-detail');
      let quantity    = $(elt_parent).find('input[type=text]:first').val();
      items.push(
        getProduct($(elt_parent), {'quantity': parseInt(quantity) })
      );   
    }

    if(!items.length)
      return false;
    
    dataLayer.push({
      'event': 'AddToCart',
      'ecommerce': {
        'currencyCode': 'EUR',
        'add': {
          'products': items
        }
      }
    });

  });
}

/**
 * [removeToCartEcommerce ecommerce-tag-manager : Measuring Removing from a Shopping Cart]
 * @param  {[type]} element [description]
 * @return {[type]}         [description]
 */
function removeToCartEcommerce(element){
  
  if(!$(element).hasClass('basket-detail'))
    return false;

  let items = []; 
  let quantity  = $(element).find('input[type=text]:first').val();
  items.push(
    getProduct($(element), {'quantity': parseInt(quantity) })
  );

  if(!items.length)
    return false;
  
  dataLayer.push({
    'event': 'removeFromCart',
    'ecommerce': { 
      'remove': {
        'products': items
      }
    }
  }); 
}

/**
 * [checkoutAndPurchase Checkout Process, Purchase]
 * @return {[type]} [description]
 */
function checkoutAndPurchase(){
     
  if ( $('#purchase_container').is('*') && $('#purchase_container').find('.purchase-product-detail').first().is('*')) {
    let items = [];
    $('.purchase-product-detail').each(function (index, product) {
      items.push( getProduct($(product), {
        'quantity': $(product).data('quantity')
      }));
    });

    if(!items.length)
      return false;

    let $information = $('.purchase-information');    
    if ( $information.data('step') == 'complete' ) {
      dataLayer.push({
        'event': 'Purchase',
        'ecommerce': {
          'currencyCode': 'EUR',
          'purchase': {
            'actionField': {
              'id': $information.data('id'),
              'revenue': $information.data('revenue'),
              'tax': $information.data('tax'),
              'shipping': manadio($information.data('shipping'))
            },
            'products': items
          }
        }
      })
    } else {
      let $information_paiement = $('.purchase-information-paiement').find('input[type=radio]:checked');
      dataLayer.push({
        'event': 'checkout',
        'ecommerce': {
          'checkout': {
            'actionField': { 'step': $information.data('step'), 'option': $information_paiement.data('option') },
            'products': items
          }
        }
      });
    }
  }
}

/**
 * [onCheckoutOption description]
 * @return {[type]} [description]
 */
function onCheckoutOption() {
  if($('.purchase-information-paiement').is('*')){
    let $information = $('.purchase-information');
    $('input[name=idpayment]').on('click', function(){
        /*for(let data in dataLayer){
          let verif = dataLayer[data];
          if(verif.event == 'checkout' && typeof verif.ecommerce == "object" && typeof verif.ecommerce.checkout == "object")
            dataLayer[data].ecommerce.checkout.actionField.option = $(this).data('option');
        }*/
        if ($('#accept_condition').is(':checked') && $(this).is(':checked')){
          dataLayer.push({
            'event': 'checkoutOption',
            'ecommerce': {
              'checkout_option': {
                'actionField': {'step': $information.data('step'), 'option': $(this).data('option')}
              }
            }
          });          
        }
    });
  }
}

/**
 * [promotionImpressions description]
 * @param  {Array}  items [description]
 * @return {[type]}       [description]
 */
function promotionImpressions(){  
  let promotions  = [];  
  if(window.position == undefined) 
    window.position = 1;        
   
  
  $('.product-box').each(function(){
    let linkBox = $(this);
    $(this).find('._promo').each(function(){
        if($(this).data('promo') && $(this).data('promo') == 'has_promo' && $(this).attr("data-show") == undefined){
          let items = getProduct($(linkBox));            
          $(this).attr("data-show", "data-show");
          promotions.push({
            'id': items['id'],
            'name': items['name'],
            'creative': items['brand'],
            'position': window.position
          }); 
          window.position++; 
          /*Measuring Promotion Clicks*/ 
          promotionClick($(linkBox),promotions);
        } 
    });
  });

  if(!promotions.length)
    return false;

  dataLayer.push({
    'ecommerce': {
      'promoView': {
        'promotions': promotions
      }
    }
  });
}

/**
 * [promotionClick Measuring Promotion Clicks]
 * @param  {[type]} element [description]
 * @param  {[type]} data    [description]
 * @return {[type]}         [description]
 */
function promotionClick(element, data){
  if(!Object.keys(data).length)
    return false;
  $(element).on('click', function(){ 
     dataLayer.push({
       'event': 'promotionClick',
       'ecommerce': {
         'promoClick': {
           'promotions': data
         }
       }
     });  
  });
}

