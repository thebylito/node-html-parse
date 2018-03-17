module.exports = function(application){
	application.get('/', function(req, res){
		application.app.controllers.index.index(application, req, res);
	});
	application.get('/carlos', function(req, res){
		application.app.controllers.index.carlos(application, req, res);
	});
}