
var mongojs = require('mongojs');
var gcm = require('node-gcm');
var db = mongojs('Abdullah:1234@ds157631.mlab.com:57631/wakemeupdb', ['users']);


module.exports = (app) => {
	

	//The following API returns the list of all the registered users
	app.get('/allusers', function(req, res){
		db.users.find(function(err, docs){

			res.json(docs);

		});
	});

	//The following API is used to change the permission of alarm for specific user.
	app.post('/user/change/permission', function(req, res){

		req.checkBody('user_id', 'User Id is required').notEmpty();
		req.checkBody('alarm_id', 'Permission Id is required').notEmpty();
		req.checkBody('enabled', 'Permission value is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			var paramsRequired = {
			msg: "Please check the parameters."
				}
			res.status(500).json(paramsRequired);  
				}else{
					db.users.find({"_id": mongojs.ObjectId(req.body.user_id)}, function(err, docs){

					var alarmsArray = docs[0].alarm_permissions;

						for (var i = 0; i <alarmsArray.length; i++) {
							if (alarmsArray[i].alarmId === req.body.alarm_id) {
								alarmsArray[i].enabled = req.body.enabled;
							}
						}
					
					var updateAlarmList = {
		  			$set: { alarm_permissions: alarmsArray}
					}

					db.users.update({"_id": mongojs.ObjectId(req.body.user_id)}, updateAlarmList, function(err, docs){                   
						if(err){
							var exception = {
								msg: "Some unexpected error occured while connecting to the database."
							}

							resp.status(500).json(exception);
						}else{
							db.users.find({"_id": mongojs.ObjectId(req.body.alarm_id)}, function(err, docs){

							var permissionsArray = docs[0].permissions;

								for (var i = 0; i <permissionsArray.length; i++) {
									if (permissionsArray[i].permissionId === req.body.user_id) {
										permissionsArray[i].enabled = req.body.enabled;
									}
								}
							
							var updatePermissionsList = {
							$set: { permissions: permissionsArray}
							}

							db.users.update({"_id": mongojs.ObjectId(req.body.alarm_id)}, updatePermissionsList, function(err, docs){
								if(err){

								var exception = {
									msg: "Some unexpected error occured while connecting to the database."
								}

								resp.status(500).json(exception);

								}else{

									var permissionRevoked = {
										msg: "Permission revoked successfully."
									}
									res.json(permissionRevoked);
								}
							});

						
							});
						}
					});

				
				});
				
					

					}

	});

	//The following API is used to send the alram to specific user.
	app.post('/postnotification', function(req, res){

		req.checkBody('device_reg_token', 'Target Device Registration Token is Required').notEmpty();
		req.checkBody('user_id', 'User Id is Required').notEmpty();

		var errors = req.validationErrors();

		if(errors){

			var notificationSendError = {
						msg: "Unable to send the notification. Please check the device id."
					}

			res.status(500).json(notificationSendError);

		}else{
		db.users.find({"device_id": req.body.device_reg_token}, function(err, docs){
			if(err){

			}else{
				var alarmsArray = docs[0].permissions;

						function checkPermission(alarmsArray){
							for (var i = 0; i <alarmsArray.length; i++) {
							if (alarmsArray[i].permissionId === req.body.user_id) {
								if(alarmsArray[i].enabled){
									return true;
								}else{
									return false;
								}
							}
						}
					}

					if(checkPermission(alarmsArray)){
						var gcm = require('node-gcm');
 
						// Set up the sender with your GCM/FCM API key (declare this once for multiple messages) 
						var sender = new gcm.Sender('AIzaSyCXleFoZJpFHBc-M9xQ-X8lUcACFCwBKFE');
						
						// Prepare a message to be sent 
						var message = new gcm.Message({
						    data: { key1: 'msg1' }
						});
						
						// Specify which registration IDs to deliver the message to 
						var regTokens = [req.body.device_reg_token];

						// Actually send the message 
						sender.send(message, { registrationTokens: regTokens }, function (err, response) {
						    if (err) console.error(err);
						    else{
						    	console.log(response);

								var notificationSent = {
										msg: "The notification sent successfully"
									}

									res.json(notificationSent);		    }

						});
					}
					else{
						var userPermissionRevoked = {
						msg: "Unable to send the alarm the other user might have revoked your permission."
					}
						res.status(500).json(userPermissionRevoked);
					}
				}
		});
	}

	});



//The following API is used to get all the alarms of specific user
app.post('/users/getalarms', function(req, res){

		var resp = res;
		var reqd = req;

		req.checkBody('user_id', 'UserID is Required').notEmpty();

		var errors = req.validationErrors();

		if(errors){

			res.json(errors);

		}else{

			db.users.find({"_id": mongojs.ObjectId(req.body.user_id)}, function(err, docs){

				if(err){
					var exception = {
								msg: "Some unexpected error occured while connecting to the database."
							}

							resp.status(500).json(exception);
				}
				else
				{

				if(docs.length == 0){
					var wrongUserId = {
								msg: "Unable to get alarms list. Make sure you have sent the correct user_id."
							}

							resp.status(500).json(wrongUserId);
				}else{
					var alarmsArray = docs[0].alarm_permissions;
					var queryAlarms = [];

					for (var i = 0; i < alarmsArray.length; i++) {

						queryAlarms.push(mongojs.ObjectId(alarmsArray[i].alarmId));

					    }

					db.users.find({
						"_id": {
							"$in": queryAlarms}
						}, function(err, docs){
								resp.json(docs);
					     });
				}
				

				}
			});
			
		}

	});


//The following API is used to get all the permissions of specific user
app.post('/users/getpermissions', function(req, res){

		var resp = res;
		var reqd = req;

		req.checkBody('user_id', 'UserID is Required').notEmpty();

		var errors = req.validationErrors();

		if(errors){

			res.json(errors);

		}else{

			db.users.find({"_id": mongojs.ObjectId(req.body.user_id)}, function(err, docs){

				if(err){

				}
				else
				{

				if(docs.length == 0){
					var wrongUserId = {
								msg: "Unable to get permissions list. Make sure you have sent the correct user_id."
							}

							resp.status(500).json(wrongUserId);
				}else{
					var permissionsArray = docs[0].permissions;
					var queryPermissions = [];

					for (var i = 0; i <permissionsArray.length; i++) {

						queryPermissions.push(mongojs.ObjectId(permissionsArray[i].permissionId));

					    }

					db.users.find({
						"_id": {
							"$in": queryPermissions}
						}, function(err, docs){
								resp.json(docs);
					     });
				}
				

				}
			});
			
		}

	});



	//The following API is used to enter the permission against specific user.
	app.post('/users/addpermission', function(req, res){

		var resp = res;
		var reqd = req;
		var permissionId = req.body.permission_id;
		var alarmId = req.body.user_id;

		req.checkBody('user_id', 'UserID is Required').notEmpty();
		req.checkBody('permission_id', 'PermissionID is Required').notEmpty();

		var errors = req.validationErrors();

		if(errors){

			res.json(errors);

		}else{

			db.users.find({"_id": mongojs.ObjectId(req.body.user_id)}, function(err, docs){

				var permissionsArray = docs[0].permissions;

				function contains(permissionsArray, permissionId) {
				    for (var i = 0; i <permissionsArray.length; i++) {
				        if (permissionsArray[i].permissionId === permissionId) {
				            return true;
				        }
				    }
				    return false;
				}

				if(contains(permissionsArray, permissionId)){

					var userPermissionAlreadyAdded = {
						msg: "The permission is already added"
					}

					resp.status(500).json(userPermissionAlreadyAdded);

				}else{

					var updatePrmission = {
		    		$push: { permissions: {permissionId,"enabled": true}}
		  			};

		  			var updateAlarm = {
		  			$push: { alarm_permissions: {alarmId,"enabled": true}}
		  			}


					db.users.update({"_id": mongojs.ObjectId(req.body.user_id)}, updatePrmission, function(err, docs){

						if(docs.length == 0){

							var userDosentExistResp = {
								msg: "Unable to add the permission. Specified user dosent exists."
							}

							resp.status(500).json(userDosentExistResp);

						}else{

							db.users.update({"_id": mongojs.ObjectId(req.body.permission_id)}, updateAlarm, function(err, docs){

								if(docs.length == 0){

									var userDosentExistResp = {
										msg: "Unable to add the alarm. Specified user dosent exists."
									}

									resp.status(500).json(userDosentExistResp);

								}else{

									var permissionAddedSuccessfully = {
										msg: "Permission Added Successfully."
									}
									resp.json(permissionAddedSuccessfully);
								}

							});
						}

					});
					
				}

			});
			
		}

	});


	//The following API is used to find the specific user using his phone number.
	app.post('/users/find', function(req, res){

		var resp = res;
		var reqd = req;

		req.checkBody('phone', 'Phone is Required').notEmpty();
		req.checkBody('user_id', 'User Id is Required').notEmpty();

		var errors = req.validationErrors();

		if(errors){
			res.json(errors);
		}else{
			db.users.find({"phone": req.body.phone}, function(err, docs){

				if(docs.length == 0){

					var userDosentExistResp = {
						msg: "User dose not exist"
					}

					resp.status(500).json(userDosentExistResp);

				}else{
					if(docs[0]._id == reqd.body.user_id){
						var unabeToAddPermission = {
						msg: "Unable to add permission for this user."
					}

					resp.status(500).json(unabeToAddPermission);

					}else{
						resp.json(docs);
					}
				}

			});
		}

	});

	//the following API is used to register the new user.
	app.post('/users/register', function(req, res){

		var resp = res;

		req.checkBody('device_id', 'Device ID is Required').notEmpty();
		req.checkBody('name', 'Name is Required').notEmpty();
		req.checkBody('phone', 'Phone is Required').notEmpty();

		var errors = req.validationErrors();

		if(errors){
				res.json(errors);
		}else{

			var userPhone = req.body.phone;
			var userId;
			db.users.find({phone: userPhone}, function(err, docs){
				if(docs.length == 0){

					var newUser = {

					device_id: req.body.device_id,
					name: req.body.name,
					phone: req.body.phone,
					profile_img: req.body.profile_img,
					permissions: [],
					alarm_permissions:[]

					}

				db.users.insert(newUser, function(err, res){

					if(err){
					console.log(err);
					}else{

					var userRegisteredResp = {
						user_id: res._id,
						msg: "User Registered Successfully"
					}

					resp.status(200).json(userRegisteredResp);
					}

				});

			}else{
					userId = docs[0]._id;

					db.users.update({"phone": userPhone}, {$set: {device_id: req.body.device_id}}, {multi: false}, function (err, docs) {

						if(err){
							var unableToLogin = {
							msg: "Unable Login at this time please try again later."
							}
							resp.status(500).json(unableToLogin);

						}else{
							var userLoggedIn = {
							user_id: userId,
							msg: "User Logged In Successfully"
							}
							resp.status(200).json(userLoggedIn);
						}
					});
				}
			});

		}

	});


app.post('/user/profile', function (req, res) {

	req.checkBody('user_id', 'User ID is Required').notEmpty();
	req.checkBody('profile_img', 'Link to the profile picture is Required').notEmpty();

	var errors = req.validationErrors();

	if(errors){
		res.json(errors);
	}else{
		db.users.update({"_id": mongojs.ObjectId(req.body.user_id)}, {$set: {profile_img: req.body.profile_img}}, {multi: false}, function (err, docs) {
			if(err){
				res.json(err);
			}else{
				var profilePictureAdded = {
						msg: "Profile picture added successfully"
				}
				res.status(200).json(profilePictureAdded);
			}
		});
	}
	
});


	// //The following API was written to use multer for image upload.
	// app.post('/user/profile', function (req, res) {
	// 	upload(req, res, function (err, cb) {
	// 		if (err) {
	// 		// An error occurred when uploading
	// 		if(req.fileValidationError){
	// 			var fileTypeError = {
	// 				msg: req.fileValidationError
	// 			}
	// 			res.status(500).json(fileTypeError);
	// 		}else{
	// 			var unableToUpload = {
	// 				msg: "Unable to upload this file! Max file size allowed is 2 MB."
	// 			}
	// 			res.status(500).json(unableToUpload);
	// 		}
	// 	}
	// 	else{
	// 		// Everything went fine
	// 		res.status(200).json(req.file);
	// 	}
	// 	});
	// });


	//The following API can be used to delete the user for some reason.
	app.delete('/users/delete/:id?', function(req, res){
		console.log(req.query.id);
		res.send('Success');

	});
	
}