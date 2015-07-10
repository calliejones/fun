var mongoose = require('mongoose');
var Post = require('../models/posts');
var Comment = require('../models/comments');
var User = require('../models/users');
var express = require('express');
var router = express.Router();
var passport = require('passport');
var jwt = require('express-jwt');

var auth = jwt({secret: 'SECRET', userProperty: 'payload'});

/* GET home page. */
router.get('/', function(req, res){
  res.render('index', { title: 'Express' });
});

router.param('post', function(req, res, next, id) {
    var query = Post.findById(id);
    
    query.exec(function(err, post){
        if(err) { 
            return next(err); 
        }
        if(!post) { 
            return next(new Error('can\'t find post'));
        }
        
        req.post = post;
        return next();
    });
});

router.param('comment', function(req, res, next, id) {
    var query = Comment.findById(id);
    
    query.exec(function(err, comment){
        if(err) { 
            return next(err); 
        }
        if(!comment) { 
            return next(new Error('can\'t find comment'));
        }
        
        req.comment = comment;
        return next();
    });
});

router.get('/posts', function(req, res, next) {
    Post.find(function(err, posts){
        if(err) { return next(err); }
        
        res.json(posts);
    });
});

router.post('/posts', auth, function(req, res, next){
    console.log('creating post: ' + req.body.toString());
    //console.log('auth: ' + auth);
    var post = new Post(req.body);
    console.log('hahah');
    console.log('payload: ' + req.payload);
    post.author = req.payload.username;
    
    
    post.save(function(err, post) {
        console.log('author: ' + post.author);
        if(err) { 
            console.log(err);
            return next(err); 
            
        }
        
        res.json(post);
    });
});

router.get('/posts/:post', function(req, res, next) {
    req.post.populate('comments', function(err, post) {
        if(err) {
            return next(err);
        }    
        
        res.json(post);
    });
    
});

router.put('/posts/:post/upvote', auth, function(req, res, next) {
    req.post.upvote(function(err, post) {
        if(err) {
            return next(err);
        }
        
        res.json(post);
    });
});

router.post('/posts/:post/comments', auth, function(req, res, next) {
    var comment = new Comment(req.body);
    comment.post = req.post;
    comment.author = req.payload.username;
    
    comment.save(function(err, comment) {
        if(err) {
            return next(err);
        }
        
        req.post.comments.push(comment);
        req.post.save(function(err, post) {
            if(err) {
                return next(err);
            }
            res.json(comment);
        });
    });
    
});

router.put('/posts/:post/comments/:comment/upvote', auth, function(req, res, next) {
    req.comment.upvote(function(err, post) {
        if(err) {
            return next(err);
        }
        
        res.json(post);
    });
});

router.post('/register', function(req, res, next) {
    if(!req.body.username || !req.body.password)     {
        return res.status(400).json({message: 'Please fill out all fields'});
    }
    
    var user = new User();
    
    user.username = req.body.username;
    user.setPassword(req.body.password);
    
    user.save(function(err){
        if(err) {
            return next(err);
        }
        return res.json({token: user.generateJWT});
    });
    
});

router.post('/login', function(req, res, next) {
    if(!req.body.username || !req.body.password)     {
        return res.status(400).json({message: 'Please fill out all fields'});
    }
    
    passport.authenticate('local', function(err, user, info) {
        if(err) {
            return next(err);
        }
        
        if(user) {
            return res.json({token: user.generateJWT()});
        } else {
            return res.status(404).json(info);
        }
    })(req, res, next);
});


module.exports = router;
