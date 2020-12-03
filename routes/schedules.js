// import/conf expres
const express = require('express');
const router = express.Router();
router.use(express.json());

var firebase = require('firebase-admin');
// import { NextFunction, Request, Response } from 'express';

var serviceAccount = require("../course-registration-site-firebase-adminsdk-k7obh-7a2ba905b4.json");
firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: "https://course-registration-site.firebaseio.com"
});
  


/****** Authentication ******/
const getAuthToken = (req, res, next) => {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        req.authToken = req.headers.authorization.split(' ')[1];
    } else {
        req.authToken = null;
    }
    next();
};

const checkIfAuthenticated = (req, res, next) => {
  getAuthToken(req, res, async () => {
    try {
      const { authToken } = req;
      const userInfo = await firebase.auth().verifyIdToken(authToken);
      req.authId = userInfo.uid;
      req.displayName = userInfo.name;
      return next();
    } catch (e) {
      return res.status(401).send({ error: 'You are not authorized to make this request' });
    }
  });
};

const checkIfAdmin = (req, res, next) => {
  getAuthToken(req, res, async () => {
    try {
      const userInfo = await firebase.auth().verifyIdToken(req.authToken);
      if (userInfo.admin === true) {
        req.authId = userInfo.uid;
        req.displayName = userInfo.name;
        return next();
      }
      else {
        return res.status(401).send({ error: 'You are not authorized to make this request' });  
      }
    } catch (e) {
      return res.status(401).send({ error: 'You are not authorized to make this request' });
    }
  });
};

/****** Routes ******/

/**
 * Add or update a schedule
 */
router.put('/users', checkIfAuthenticated, async (req, res) => {
    try {
      const isPublic = req.body.publicVis;

      const response = await firebase.database().ref(`user/${req.authId}`).child(req.body.title).set({
          title: req.body.title,
          description: req.body.description,
          courses: req.body.courses,
          lastEdited: req.body.lastEdited,
          publicVis: isPublic
      });

      // now try to add to public schedules list
      if (isPublic) {
        // check for existing public schedule with that name - if exists, only
        // allow the same user to update
        const existing = await firebase.database().ref('public')
          .child(req.body.title).once('value');

        // schedule with this title exists, is NOT from same user
        if (existing.val() && existing.val().displayName !== req.displayName) {
          res.status(500).send(JSON.stringify('A publicly posted schedule with this name already' +
          ' exists! Your schedule was still saved privately.'));
        }
        // overwrite existing
        else {
          const pubResponse = await firebase.database().ref('public')
            .child(req.body.title).set({
              title: req.body.title,
              description: req.body.description,
              courses: req.body.courses,
              lastEdited: req.body.lastEdited,
              displayName: req.displayName
            });

            res.send(pubResponse);
        }
      }
      else {
        res.send(JSON.stringify(`Saved schedule \'${req.body.title}\'`));
      }
    } catch(e) {
        res.status(500).send(e.message);
    }
});

router.delete('/users/:schedName', checkIfAuthenticated, async (req, res) => {
  try {
    const response = await firebase.database().ref(`user/${req.authId}`)
      .child(req.params.schedName).once('value');

    if (response.val().publicVis) {
      const pubResponse = await firebase.database().ref('public')
        .child(req.params.schedName).remove();
    }

    response.ref.remove();

    res.send(response);
  } catch(e) {
    res.status(500).send('Could not delete schedule.');
  }
});

/**
 * Get all publicly posted schedules
 */
router.get('/public', async(req, res) => { //TODO fix this
  try {
    // get public schedules list
    const response = await firebase.database().ref('public').once('value');

    res.send(response);
  } catch(e) {
    res.status(500).send(e.message);
  }
});

router.delete('/public', checkIfAuthenticated, async (req, res) => {
  try {
    const response = await firebase.database().ref('public').remove()


    res.send(response);
  } catch(e) {
    res.status(500).send('Could not delete.');
  }
});

module.exports = router;