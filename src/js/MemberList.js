

function MemberList() {
	var target;
	
	/* fetch list of users from server */
	this.update = function() {
		$.get('/ajaxCall?action=getUserList', function(data) {
			var users = JSON.parse(data);
			$.each(users.data, function(i, user) {
//				alert(user);
				var userDIV = $("<DIV class='ui_item' id='user_"+user[0]+"'></DIV>");
				if (user[0]==p1) {
					userDIV.css('color',playerColor[p1]);
					return true;
				}
				$(userDIV).click(function() {
//					alert($(this).attr('id')+ " clicked");
					init(user[0]);
					runMatch(p1,user[0]);
				});
				userDIV.append(user[0]);
				$(memberList.target).find(".ui_list").append(userDIV);
			});
		});
	}
	
	this.init = function(tID) {
		this.target = $(tID);
		$(this.target).addClass("ui_panel");
		$(this.target).empty();
		$(this.target).append("<DIV id='button_toggle_userlist' style='font-size:0.75em; cursor:pointer; font-weight:bold; color:#aaa;font-family:helvetica'>SELECT OPPONENT</DIV>");
		var listDIV = $("<DIV id='userlist' class='ui_list'></DIV>");
		$(this.target).append(listDIV);
		$("#button_toggle_userlist").click(function() { 
					$('#userlist').toggle();
					$(this).parent().toggleClass('ui_panel_closed');
					$(this).parent().toggleClass('ui_panel');
						
		});
		this.update();	
	}
	this.close =function() {
		$('#userlist').toggle();
	}
	
	
	
}

