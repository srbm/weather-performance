'use strict';

$.ajax({
  headers: {'X-Auth-Token': footballToken},
  url: 'http://api.football-data.org/v2/competitions/PL/teams?season=2018',
  dataType: 'json',
  type: 'GET',
}).done(function(response) {
  console.log(response);
  for (let i = 0; i<20; i++) {
    const teamId = response.teams[i].id;
    // teamIds.push(teamId);
    $('.team:eq('+i+')').data('team-id', teamId);
    console.log($('.team:eq('+i+')').data('team-id'));
  }
});
