exports.getAccount = (req, res, next) => {
    if(req.session.isAuthorized){
        res.render('account', {
            user: req.session.user
        })
    }
    else{
        res.redirect('/login');
    }
};

exports.getPrivate = (req, res, next) => {
    if(req.session.isAuthorized)  {
        res.render('private', {
            user: req.session.user
        });
    }
    else{
        res.redirect('/login');
    }
};