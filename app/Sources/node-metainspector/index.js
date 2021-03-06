var util = require('util'),
  request = require('request'),
  events = require('events'),
  cheerio = require('cheerio'),
  URI = require('uri-js'),
  _ = require('lodash');

var debug;
const arrayPrice = [
  "meta[itemprop='price']",
  "span[class='price-tag']",
  "span[class='regular-price']",
  "div[class='price-box-avista']",
  "div[class='new-value']",
  "strong[class='skuBestPrice']",
  "span[class='real-price']",
  'p[class=sales-price]',
  'strong[itemprop=price]',
  "span[class='a-size-medium a-color-price inlineBlock-display offer-price a-text-normal price3P']",
  "span[id='priceblock_ourprice']",
  "span[itemprop='lowPrice']",
  "span[class='price-old current']",
  "span[class='product-price-sell']",
  "span[class='value']",
  "strong[class='skuBestPrice']",
  "div[class='fbits-preco']",
  "td[class='taxValueTotal']",
  "span[class='a-price']",
  "span[id='litPreco']",
  "li[class='current']",
  "span[class='btn-buy-wrap']",
  "span[class='value']",
  "div[class='precoPor']",
  "h2[class='price']",
  "span[itemprop='price']",
  "span[class='preco-por']",
  "p[class='info-cartao']",
  "span[class='preco_por_titulo preco_produto preco-por product-adjustedPrice']",
  "span[class='product-details-black']",
  "div[class='price']",
  "div[class='preco-produto destaque-avista ']",
  "div[class='col-lg-12 text-center']",
  "div[class='preco-a-vista']",
  "div[id='divPrecoProduto']",
  "h4[class='price item_promo']",
  "h4[class='price']",
  "dd[itemprop='price']",
  "span[class='special-price-value']",
  "p[class='special-price']",
  "span[id='Span3']",
  "p[class='boleto-price']",
  "meta[property='product:price:amount']",
  "span[class='preco']"
];
const arrayOldPrice = [
  "div[class='fbits-preco']",
  "div[class='old-value ctrValorDeArea']",
  "strong[class='skuListPrice']",
  'del[class=reduce]',
  'del[class=value]',
  "span[class='a-color-secondary a-text-strike']",
  "span[itemprop='highPrice']",
  "span[class='price-old col-xs-12 col-sm-12 col-md-12']",
  "span[class='product-price-old']",
  "div[class='precoDe']",
  "h3[class='price-original']",
  "del[class='price reduce']",
  "span[class='discount-price']",
  "div[class='cartao-destaque']",
  "span[class='preco_de']",
  "span[class='regular-price']",
  "p[class='product-detail-old-price']",
  "div[class='col-lg-6 col-md-6 col-sm-6 col-xs-12 preco-produto ']",
  "strike[class='preco-antigo']",
  "h5[class='price price_old']",
  "del[class='list-price']",
  "span[class='a-text-strike']",
  "p[class='old-price']",
  "h6[class='price price_old']"
];
const arrayImgProduto = [
  "img[class='x-product__img-thumb js--product-img-thumb is--active']",
  "img[class='swiper-lazy swiper-img swiper-lazy-loaded']",
  "a[rel='zoomWidth']",
  "img[id='image-main']",
  "img[id='ImagemPrincipalProduto']",
  "link[rel='image_src']",
  "img[class='swiper-slide-img']",
  "img[itemprop='image']",
  "span[class='nav-logo-base nav-sprite']",
  "img[class='rollovercartItemImg no-margin']",
  "a[id='botaoZoom']",
  "img[id='imgProduct']",
  "img[class='gallery-image visible']",
  "img[id='landingImage']",
  "img[class='x-product__img-thumb js--product-img-thumb is--active']",
  "img[name='ProdutoImagemAux']",
  "a[id='cloudZoom']",
  "a[class='a-img a-img--product-carousel current-img']",
  "img[id='imgPrincipalProduto']",
  "a[class='img-responsive center-block lazyOwl']",
  "img[id='image-viewer-first']",
  "img[class='img-produto']"
];

const arrayProdArray = [
  {
    site: 'www.amissima.com.br',
    local: 3,
    take: [{ title: 'RKProductName' }, { price: 'RKProductPrice' }],
    regex: /({(.*?}))/g
  },
  {
    site: 'loja.electrolux.com.br',
    local: 24,
    take: [{ image: 'image' }],
    regex: /\[{"sku".*}]/g
  },
  {
    site: 'www.fastshop.com.br',
    local: 70,
    take: [{ price: 'productSalePrice' }],
    regex: /\[{.*]/g
  }
];

if (/\bmetainspector\b/.test(process.env.NODE_DEBUG)) {
  debug = function() {
    console.error('METAINSPECTOR %s', util.format.apply(util, arguments));
  };
} else {
  debug = function() {};
}

function withDefaultScheme(url) {
  return URI.parse(url).scheme ? url : 'http://' + url;
}

var MetaInspector = function(url, options) {
  this.url = URI.normalize(withDefaultScheme(url));

  this.parsedUrl = URI.parse(this.url);
  this.scheme = this.parsedUrl.scheme;
  this.host = this.parsedUrl.host;
  this.rootUrl = this.scheme + '://' + this.host;

  this.options = options || {};
  //default to a sane limit, since for meta-inspector usually 5 redirects should do a job
  //more over beyond this there could be an issue with event emitter loop detection with new nodejs version
  //which prevents error event from getting fired
  this.options.maxRedirects = this.options.maxRedirects || 5;

  //some urls are timing out after one minute, hence need to specify a reasonable default timeout
  this.options.timeout = this.options.timeout || 20000; //Timeout in ms

  this.options.strictSSL = !!this.options.strictSSL;

  this.options.headers = this.options.headers || {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.162 Safari/537.36'
  };
};
function JSONize(str) {
  return (
    str
      // wrap keys without quote with valid double quote
      /*  .replace(/([\$\w]+)\s*:/g, function(_, $1) {
        return '"' + $1 + '":';
      }) */
      // replacing single quote wrapped ones to double quote
      .replace(/'([^']+)'/g, function(_, $1) {
        return '"' + $1 + '"';
      })
      //.replace(/[^\x20-\x7E]/gmi, "")
      //.replace(/(\r\n|\n|\r)/gm,"")
      //.replace(/\s+/g," ")
      .replace(/[a-zA-z]+[(]?[a-zA-Z]+\([0-9]\)[)]?/g, '""')
      .replace(/[a-zA-z]+\("[a-z]+"\)/g, '""')
      .replace(/'"/g, '""')
      .replace(/"[a-z]+'/g, '""')
      .replace(/\s[a-z0-9]",/g, '')
      .trim()
  );
}
MetaInspector.prototype.getArray = function() {
  if (!this.arrayProd) {
    const [proto, pro, url] = this.url.split('/');
    let siteToParse = arrayProdArray.find((item) => item.site === url);
    if (siteToParse) {
      const { site, local, take, regex } = siteToParse;
      var value = this.parsedDocument('script').map((i, elem) => {
        if (i === local - 1) {
          let data = elem.children[0].data;
          data = String(data);
          data = data.replace(/\s{2,}/g, '');
          console.log(data);

          data = data.match(regex);
          const [array] = data;
          //console.log(JSONize(array));
          //console.log(JSON.parse(JSONize(array)));
          //console.log(JSON.stringify(eval('('+array+')')))
          //arrayJson1 = JSON.parse(JSONize(array));
          arrayJson1 = JSON.parse(JSONize(array));
          arrayJson = arrayJson1.length >= 1 ? arrayJson1[0] : arrayJson1;
          //console.log(arrayJson.image);
          take.map((val, i) => {
            for (var name in val) {
              var value = val[name];
              switch (name) {
                case 'title':
                  this.title = arrayJson[val[name]];
                case 'price':
                  this.price = arrayJson[val[name]];
                case 'image':
                  this.image = arrayJson[val[name]];
              }
            }
          });

          this.arrayProd = true;
        }
      });
    }
  }

  return this;
};

//MetaInspector.prototype = new events.EventEmitter();
MetaInspector.prototype.__proto__ = events.EventEmitter.prototype;
module.exports = MetaInspector;

MetaInspector.prototype.getImgProduto = function() {
  if (!this.imgProduto && !this.image) {
    arrayImgProduto.some((i, e) => {
      // console.log(i);
      var img = this.parsedDocument(i).attr('src');
      if (!img) {
        var img = this.parsedDocument(i).attr('href');
      }
      if (!img) {
        var img = this.parsedDocument(i).attr('rel');
      }
      if (img) {
        img = img;
        // console.log(img);
        if (Array.isArray(img)) {
          this.imgProduto = this.getAbsolutePath(img[0].trim());
          //  console.log(this.imgProduto);
          return true;
        } else {
          this.imgProduto = this.getAbsolutePath(img.trim());
          //  console.log(this.imgProduto);
          return true;
        }
        //this.imgProduto = this.getAbsolutePath(img);
      }
      /*       //console.log(i);
      //console.log(e);
      value = this.parsedDocument(i).text();
      //console.log(value);
      if (value !== undefined && value !== "" && value !== null) {
        if (parseInt(value) != 1) {
			//console.log(value)
			//rx = /([0-9]+[,{1}.{1}||,{1}||.{1}][0-9]+)/g;
			rx = /([[\d]+]?[(.?||,?)]?[[\d]+]?[[(.?||,?)]]?[\d]{2})/g;
			value = value.match(rx) || false;
			if(value){
				this.imgProduto = value[0].trim();
				return true;
			}
        }
      } */
    });
  }

  return this;
};

MetaInspector.prototype.getPrice = function() {
  debug('Parsing page description based on meta elements');

  if (!this.price) {
    arrayPrice.some((i, e) => {
      //console.log(i);
      //console.log(e);
      var value = this.parsedDocument(i).attr('content');
      //  console.log('hue:' + value);
      if (!value) {
        value = this.parsedDocument(i).text();
      }
      // console.log(value);
      if (value !== undefined && value !== '' && value !== null) {
        // console.log(value);
        if (parseInt(value) != 1) {
          // console.log(value);
          rx = /([0-9]+[,{1}.{1}||,{1}||.{1}][0-9]+)/g;
          //rx = /\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})/g;
          value = value.match(rx) || false;
          if (value) {
            this.price = value[0].trim();
            return true;
          }
        }
      }
    });
  }

  return this;
};
MetaInspector.prototype.getOldPrice = function() {
  debug('Parsing page description based on meta elements');

  if (!this.oldPrice) {
    arrayOldPrice.some((i, e) => {
      //console.log(i);
      //console.log(e);
      value = this.parsedDocument(i).text();
      //console.log(value);
      if (value !== undefined && value !== '' && value !== null) {
        if (parseInt(value) != 1) {
          //console.log(value)
          //rx = /([0-9]+[,{1}.{1}||,{1}||.{1}][0-9]+)/g;
          rx = /([[\d]+]?[(.?||,?)]?[[\d]+]?[[(.?||,?)]]?[\d]{2})/g;
          value = value.match(rx) || false;
          if (value) {
            this.oldPrice = value[0].trim();
            return true;
          }
        }
      }
    });
  }

  return this;
};

MetaInspector.prototype.getTitle = function() {
  debug('Parsing page title');

  if (!this.title) {
    this.title = this.parsedDocument('head > title').text();
  }

  return this;
};

MetaInspector.prototype.getOgTitle = function() {
  debug('Parsing page Open Graph title');

  if (!this.ogTitle) {
    this.ogTitle = this.parsedDocument("meta[property='og:title']").attr(
      'content'
    );
  }

  return this;
};

MetaInspector.prototype.getOgDescription = function() {
  debug('Parsing page Open Graph description');

  if (this.ogDescription === undefined) {
    this.ogDescription = this.parsedDocument(
      "meta[property='og:description']"
    ).attr('content');
  }

  return this;
};

MetaInspector.prototype.getOgType = function() {
  debug("Parsing page's Open Graph Type");

  if (this.ogType === undefined) {
    this.ogType = this.parsedDocument("meta[property='og:type']").attr(
      'content'
    );
  }

  return this;
};

MetaInspector.prototype.getOgUpdatedTime = function() {
  debug("Parsing page's Open Graph Updated Time");

  if (this.ogUpdatedTime === undefined) {
    this.ogUpdatedTime = this.parsedDocument(
      "meta[property='og:updated_time']"
    ).attr('content');

    return this;
  }
};

MetaInspector.prototype.getOgLocale = function() {
  debug("Parsing page's Open Graph Locale");

  if (this.ogLocale === undefined) {
    this.ogLocale = this.parsedDocument("meta[property='og:locale']").attr(
      'content'
    );
  }

  return this;
};

MetaInspector.prototype.getLinks = function() {
  debug('Parsing page links');

  var _this = this;

  if (!this.links) {
    this.links = this.parsedDocument('a').map(function(i, elem) {
      return _this.parsedDocument(this).attr('href');
    });
  }

  return this;
};

MetaInspector.prototype.getMetaDescription = function() {
  debug('Parsing page description based on meta elements');

  if (!this.description) {
    this.description = this.parsedDocument("meta[name='description']").attr(
      'content'
    );
  }

  return this;
};

MetaInspector.prototype.getSecondaryDescription = function() {
  var _this = this;

  this.parsedDocument('p').each(function(i, elem) {
    if (_this.description) {
      return;
    }

    var text = _this.parsedDocument(this).text();

    // If we found a paragraph with more than
    if (text.length >= minimumPLength) {
      _this.description = text;
    }
  });
  return this;
};

MetaInspector.prototype.getDescription = function() {
  debug(
    'Parsing page description based on meta description or secondary description'
  );
  this.getMetaDescription() && this.getSecondaryDescription();

  return this;
};

MetaInspector.prototype.getKeywords = function() {
  debug('Parsing page keywords from apropriate metatag');

  if (!this.keywords) {
    var keywordsString = this.parsedDocument("meta[name='keywords']").attr(
      'content'
    );

    if (keywordsString) {
      this.keywords = keywordsString.split(',');
    } else {
      this.keywords = [];
    }
  }

  return this;
};

MetaInspector.prototype.getAuthor = function() {
  debug('Parsing page author from apropriate metatag');

  if (!this.author) {
    this.author = this.parsedDocument("meta[name='author']").attr('content');
  }

  return this;
};

MetaInspector.prototype.getCharset = function() {
  debug('Parsing page charset from apropriate metatag');

  if (!this.charset) {
    this.charset = this.parsedDocument('meta[charset]').attr('charset');
  }

  return this;
};

MetaInspector.prototype.getImage = function() {
  debug('Parsing page image based on the Open Graph image');

  if (!this.image) {
    var img = this.parsedDocument("meta[property='og:image']").attr('content');
    if (img) {
      this.image = this.getAbsolutePath(img).replace(
        'www.fastshop.com.br/www.fastshop.com.br',
        ''
      );
    }
  }

  return this;
};

MetaInspector.prototype.getImages = function() {
  debug('Parsing page body images');
  var _this = this;

  if (this.images === undefined) {
    this.images = this.parsedDocument('img').map(function(i, elem) {
      var src = _this.parsedDocument(this).attr('src');
      return _this.getAbsolutePath(src);
    });
  }

  return this;
};

MetaInspector.prototype.getFeeds = function() {
  debug('Parsing page feeds based on rss or atom feeds');

  if (!this.feeds) {
    this.feeds = this.parseFeeds('rss') || this.parseFeeds('atom');
  }

  return this;
};

MetaInspector.prototype.parseFeeds = function(format) {
  var _this = this;
  var feeds = this.parsedDocument(
    "link[type='application/" + format + "+xml']"
  ).map(function(i, elem) {
    return _this.parsedDocument(this).attr('href');
  });

  return feeds;
};

MetaInspector.prototype.initAllProperties = function() {
  // title of the page, as string
  this.getTitle()
    .getAuthor()
    .getCharset()
    .getKeywords()
    .getLinks()
    .getDescription()
    .getImgProduto()
    .getImage()
    .getImages()
    .getFeeds()
    .getOgTitle()
    .getOgDescription()
    .getOgType()
    .getOgUpdatedTime()
    .getOgLocale()
    .getPrice()
    .getArray()
    .getOldPrice();
};

MetaInspector.prototype.getAbsolutePath = function(href) {
  if (/^(http:|https:)?\/\//i.test(href)) {
    return href;
  }
  if (!/^\//.test(href)) {
    href = '/' + href;
  }
  return this.rootUrl + href;
};

MetaInspector.prototype.fetch = function() {
  var _this = this;
  var totalChunks = 0;
  var r = request(
    _.assign({ uri: this.url, gzip: true }, this.options),
    function(error, response, body) {
      if (!error && response.statusCode === 200) {
        _this.document = body;
        _this.parsedDocument = cheerio.load(body);
        _this.response = response;

        _this.initAllProperties();

        _this.emit('fetch');
      } else {
        _this.emit('error', error);
      }
    }
  );

  if (_this.options.limit) {
    _this.__stoppedAtLimit = false;
    r.on('data', function(chunk) {
      totalChunks += chunk.length;
      if (totalChunks > _this.options.limit) {
        if (!_this.__stoppedAtLimit) {
          _this.emit('limit');
          _this.__stoppedAtLimit = true;
        }
        r.abort();
      }
    });
  }
};
