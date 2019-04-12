/*
*
*
*       Complete the API routing below
*       
*       
*/

'use strict';

const mongo = require('mongodb');
const mongoose = require('mongoose');
const mongooseConfig = require('../config/mongoose_config');
const CONNECTION_STRING = process.env.DB;
const { expect } = require('chai');
const { ObjectId } = require('mongodb');

mongoose.connect(CONNECTION_STRING, mongooseConfig);

const db = mongoose.connection;

const Library = db.collection('books');

module.exports = app => {
  app.get('/api/books', (req, res, next) => {
    const books = [];
    Library.find({}).forEach(book => {
      const { _id, title, comments } = book;
      books.push({ _id, title, commentcount: comments.length });
    }, err => {
      if (err) next(err);
      return res.status(200).json(books);
    }); 
  });
  
  app.post('/api/books', (req, res, next) => {
    const { title } = req.body;
    const _id = new ObjectId();
    if (!title) return res.status(400).send('missing book title');
    Library.findOne({ title }, (err, book) => {
      if (err) next(err);
      if (book) return res.status(200).json(book);
      Library.insertOne({ _id, title, comments: [] }, (err, newBook) => {
        if (err) next(err);
        if (!newBook.comments) return res.status(200).json({ _id, title, comments: [] });
        else return res.status(200).json({ _id, title, comments: newBook.comments });
      });
    });
  });
    
  app.delete('/api/books', (req, res, next) => {
    Library.deleteMany({}, (err, emptyLibrary) => {
      if (err) next(err);
      return res.status(200).send('complete delete successful');
    });
  });

  app.get('/api/books/:_id', (req, res, next) => {
    const { _id } = req.params;
    if (!ObjectId.isValid(_id)) return res.status(200).send('no book exists');
    Library.findOne({ _id: ObjectId(_id) }, (err, book) => {
      if (err) next(err);
      if (!book) return res.status(200).send('no book exists');
      const { _id, title, comments } = book;
      return res.status(200).json({ _id, title, comments });
    });
  });
    
  app.post('/api/books/:_id', async (req, res, next) => {
    const { _id } = req.params;
    const { comment } = req.body;
    if (!ObjectId.isValid(_id)) return res.status(200).send('no book exists');
    await Library.findOneAndUpdate({ _id: ObjectId(_id) }, { 
      $push: { comments: comment } 
    }, { new: true }, (err, updatedBook) => {
      if (err) next(err);
      const { _id, title, comments } = updatedBook.value;
      if (!comments) return res.status(200).json({ _id, title, comments: [comment] });
      const commentsArray = comments;
      commentsArray.push(comment);
      return res.status(200).json({ _id, title, comments: commentsArray });
    });
  });
    
  app.delete('/api/books/:_id', (req, res, next) => {
    const { _id } = req.params;
    if (!ObjectId.isValid(_id)) return res.status(200).send('no book exists');
    Library.deleteOne({ _id: ObjectId(_id) }, (err, updatedLibrary) => {
      if (err) next(err);
      return res.status(200).send('delete successful');
    });
  });
};