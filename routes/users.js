
var mongojs = require('mongojs');
var gcm = require('node-gcm');
var db = mongojs('Abdullah:1234@ds157631.mlab.com:57631/wakemeupdb', ['users']);
var Promise = require('promise');


module.exports = (app) => {

	//The following API returns the list of all the registered users
	app.get('/allusers', function(req, res){
		db.users.find(function(err, docs){

			res.json(docs);

		});
	});

	app.post('/postnofication', function(req, res){

		req.checkBody('device_reg_token', 'Target Device Registration Token is Required').notEmpty();
		var errors = req.validationErrors();

		if(errors){

			res.json(errors);

		}else{

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

	});

//The following API is used to get all the permissions of specific user

app.post('/users/getpermissions', function(req, res){

		var resp = res;
		var reqd = req;
		var permissionId = req.body.permission_id;

		req.checkBody('user_id', 'UserID is Required').notEmpty();

		var errors = req.validationErrors();

		if(errors){

			res.json(errors);

		}else{

			db.users.find({"_id": mongojs.ObjectId(req.body.user_id)}, function(err, docs){

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
		    		$push: { permissions: {permissionId}}
		  			};

		  			var updateAlarm = {
		  			$push: { alarm_permissions: {alarmId}}
		  			}


					db.users.update({"_id": mongojs.ObjectId(req.body.user_id)}, updatePrmission, function(err, docs){

						if(docs.length == 0){

							var userDosentExistResp = {
								msg: "Unable to add the permission."
							}

							resp.status(500).json(userDosentExistResp);

						}else{

							db.users.update({"_id": mongojs.ObjectId(req.body.permission_id)}, updateAlarm, function(err, docs){

								if(docs.length == 0){

									var userDosentExistResp = {
										msg: "Unable to add the alarm."
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

		var errors = req.validationErrors();

		if(errors){
			res.json(errors);
		}else{
			db.users.find({"phone": req.body.phone}, function(err, docs){

				if(docs.length == 0){

					var userDosentExistResp = [{
						param: "System",
						msg: "User dose not Exist"
					}]

					resp.json(userDosentExistResp);

				}else{

					resp.json(docs);
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
			db.users.find({phone: userPhone}, function(err, docs){
				if(docs.length == 0){

					var newUser = {

					device_id: req.body.device_id,
					name: req.body.name,
					phone: req.body.phone,
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

					var userAlreadyExistsResp = {
						msg: "User Already Exists"
					}

					resp.status(500).json(userAlreadyExistsResp);
				}
			});

		}

	});

	//The following API can be used to delete the user for some reason.
	app.delete('/users/delete/:id?', function(req, res){
		console.log(req.query.id);
		res.send('Success');

	});
	
}