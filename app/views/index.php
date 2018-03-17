<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="">
    <meta name="author" content="">
    <title>Crawler</title>
    <meta name="keywords" content=""/>
	
    <!-- Insere Jquery -->
    <script src="jquery.min.js" type="text/javascript"></script>

    <!-- Insere CSS -->
    <link rel="stylesheet" href="style.css" type="text/css" media="screen"> 

</head>

<body>

    <!-- VALIDA -->
    <?php 

        if (!isset($_POST['link'])){


            //Nao faz nada
            $preview = "";

        } else {

            $link = stripslashes($_POST['link']);

            $url = file_get_contents($link);

            $preview = htmlentities($url);

        }

    ?>
    <!-- END VALIDA -->

    <div class="link">
        
        <form method="POST" action="index.php">

            <h5>Insira o Link do Produto</h5>

            <input id="link" name="link" placeholder="Insira aqui o link" required>

            <button class="btn-buscar" type="submit">BUSCAR</button>

        </form>

    </div><!-- end link -->


    <div class="informacoes-link" id="informacoes-link">  
        <h1 id="produto-titulo"></h1>
        <h1 id="produto-valor"></h1>
        <img id="produto-foto"/>
        <h5 id="produto-informacoes"></h5>
    </div><!-- informações link -->

   
    <div class="preview-link" id="preview-link">
        <h1>PREVIEW</h1>
        <?php echo $url; ?>
    </div><!-- preview link -->
    

</body>
</html>

<script type="text/javascript">
    
    var produtoTITULO = $(".product-name").html();
    var produtoVALOR = $(".sales-price").html();
    var produtoIMG = $(".swiper-slide-img").attr("src");
    var produtoDESCRICAO = $(".info-description-frame-inside").children().html();

    $("#produto-titulo").html(produtoTITULO);
    $("#produto-valor").html(produtoVALOR);
    $("#produto-foto").attr("src",produtoIMG);
    $("#produto-informacoes").html(produtoDESCRICAO);

</script>