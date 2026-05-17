Set-Location "C:\Users\Gamer\Desktop\Back_delivery"
git config user.name "JhonataNunesAl"
git config user.email "yorn.exe@gmail.com"
git add .
git commit -m "feat: envio de nota fiscal por email apos pagamento aprovado; tipo_entrega no checkout"
git push origin main
Write-Host "Backend push concluido!"
