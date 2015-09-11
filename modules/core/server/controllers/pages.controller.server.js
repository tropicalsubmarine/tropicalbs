'use strict';

var path = require('path');

var db = require(path.resolve('./lib/db.js'));

exports.createPage = createPage;
exports.deletePage = deletePage;
exports.getPageById = getPageById;
exports.getPages = getPages;
exports.sendPage = sendPage;
exports.updatePage = updatePage;

//////////

/**
 * Creates a page in the database
 *
 * @param {ExpressRequestObject} req The request object generated by express.
 * @param {ExpressResponseObject} res The response object generated by express.
 */

function createPage (req, res) {
  var page = {};
  page.content = req.body.content;
  page.slug = checkSlug(req.body.slug);
  page.title = req.body.title;

  db.Page.create(page)
    .then(sendCreatedPage)
    .catch(send500);

  //////////

  function checkSlug (slug) {
    if (slug[0] === '/') {
      return slug;
    } else {
      return '/' + slug;
    }
  }

  function send500 () {
    res.status(500).send('Database Error: Page could not be Created');
  }

  function sendCreatedPage (page) {
    res.status(200).send(page);
  }
  
}

/**
 * Deletes a page from the database
 *
 * @param {ExpressRequestObject} req The request object generated by express.
 * @param {ExpressResponseObject} res The response object generated by express.
 */

function deletePage (req, res) {
  db.Page.destroy({ where: { id: req.page.id } })
    .then(sendDeletedPage)
    .catch(send500);

  function send500 () {
    res.status(500).send('Database Error: Page could not be deleted.');
  }

  function sendDeletedPage (page) {
    res.sendStatus(200);
  }
  
}

/**
 * Gets a page by a given id
 *
 * @param {ExpressRequestObject} req The request object generated by express.
 * @param {ExpressResponseObject} res The response object generated by express.
 * @param {function} next
 * @param {string} id The page id given in the route
 */

function getPageById (req, res, next, id) {
  var pageQuery = {
    where: {
      id: id
    }
  };

  db.Page.findOne(pageQuery)
    .then(goToNext)
    .catch(send500);

  //////////

  function goToNext (page) {
    req.page = page;
    next();
  }

  function send500 () {
    res.status(500).send('Database Error: Could not retrieve Page');
  }
}

/**
 * Get all pages from the database.
 *
 * @param {ExpressRequestObject} req The request object generated by express.
 * @param {ExpressResponseObject} res The response object generated by express.
 */

function getPages (req, res) {
  db.Page.findAll()
    .then(sendPage)
    .catch(send500);

  //////////

  function send500 () {
    res.status(500).send('Database Error: Could not retrieve Pages.');
  }

  function sendPage (pages) {
    res.status(200).send(pages);
  }
  
}

/**
 * Sends back a page, if the page exists on the req object.
 * The page is set on the req object, in other functions.
 *
 * @param {ExpressRequestObject} req The request object generated by express.
 * @param {ExpressResponseObject} res The response object generated by express.
 */

function sendPage (req, res) {
  if(req.page) {
    db.Tab.findOne({where: {uisref:'pages,'+req.page.id}})
      .then(attatchTab)
      .then(send200)
      .catch(send500);
  } else {
    res.status(400).send('Page does not exist');
  }
  
  //////////
  
  function attatchTab(tab) {
    return req.page.tab = tab;
  }
  
  function send200() {
    res.status(200).send(req.page);
  }
  
  function send500() {
    res.status(500).send('Database Error Occured');
  }
}

/**
 * Updates a page in the database
 *
 * @param {ExpressRequestObject} req The request object generated by express.
 * @param {ExpressResponseObject} res The response object generated by express.
 */

function updatePage (req, res) {
  var page = {};
  page.content = req.body.content || req.page.content;
  page.slug = req.body.slug || req.page.slug;
  page.title = req.body.title || req.page.title;
  
  var pageQuery = {
    where: {
      id: req.page.id
    }
  };

  db.Page.update(page, pageQuery)
    .then(findUpdatedPage)
    .then(sendUpdatedPage)
    .catch(send500);

  //////////

  function findUpdatedPage () {
    var pageQuery = {
      where: {
        id: req.page.id
      }
    };

    return db.Page.findOne(pageQuery);
  }

  function send500 () {
    res.status(500).send('Database Error: Page could not be updated');
  }

  function sendUpdatedPage (page) {
    res.status(200).send(page);
  }
  
}
