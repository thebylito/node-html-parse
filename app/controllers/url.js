/*Inicia o buscador de mata tags*/
var MetaInspector = require('../Sources/node-metainspector');
module.exports.parse = function(application, req, res) {
  var dadosForm = req.query;

  req.assert('url', 'Casa não pode ser vazio').notEmpty();

  var erros = req.validationErrors();

  if (erros) {
    res.send({ validacao: erros, dadosForm: dadosForm });
    return;
  }
  var client = new MetaInspector(dadosForm.url, { timeout: 10000 });

  client.on('fetch', function() {
    let oldPrice;
    if (
      parseFloat(client.price) > parseFloat(client.oldPrice) ||
      !client.oldPrice ||
      parseFloat(client.price) === parseFloat(client.oldPrice)
    ) {
      oldPrice = false;
    } else {
      oldPrice = client.oldPrice;
    }
    let image;

    if (client.image) {
      image = client.image;
    } else if (client.imgProduto) {
      image = client.imgProduto.replace(/(http(s?)):\/\//g, '');
    } else {
      dominioNome = dadosForm.url.match(
        /^[https?\:\/\/]?([^\/:?#]+)(?:[\/:?#]|$)/i
      );
      image = '//via.placeholder.com/500x500/?text=' + dominioNome[1];
    }

    res.send({
      title: client.title,
      image,
      description: client.description,
      price: client.price ? client.price : false,
      oldPrice: oldPrice
    });
  });

  client.on('error', (err) => {
    res.send({
      title: 'O site buscado não retornou qualquer resposta',
      image,
      description: 'O site buscado não retornou qualquer resposta',
      price: '0,00',
      oldPrice: '0,00'
    });
  });

  client.fetch();
};
