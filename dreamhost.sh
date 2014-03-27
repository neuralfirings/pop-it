rsync -e "/usr/bin/ssh" --exclude ".git"  --bwlimit=2000 -av /Users/nyl/Dropbox/NeuralFiringsWeb/BAM/www/ nyl@neuralfirings.com:neuralfirings.com/popper
