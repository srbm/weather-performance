/* eslint-disable no-invalid-this */
'use strict';

$.ajax({
  headers: {'X-Auth-Token': footballToken},
  url: 'http://api.football-data.org/v2/competitions/PL/teams?season=2018',
  dataType: 'json',
  type: 'GET',
}).done(function(response) {

  for (let i = 0; i<20; i++) {
    const teamId = response.teams[i].id;
    $('.team:eq('+i+') img').attr('src', response.teams[i].crestUrl);
    $('.team:eq('+i+')').data('team-id', teamId);
    $('.team:eq('+i+')').append(`<h3>${response.teams[i].name}</h3>`)
  }
});

// eslint-disable-next-line require-jsdoc
function getTeamMatchesData() {
  $('.team').on('click', function() {
    const teamMatches = [];
    const teamId = $(this).data('team-id');
    console.log(teamId);
    $.ajax({
      headers: {'X-Auth-Token': footballToken},
      url: `http://api.football-data.org/v2/teams/${teamId}/matches?dateFrom=2018-08-10&dateTo=2019-05-12`,
      dataType: 'json',
      type: 'GET',
    }).done(function(response) {
      for (let i = 0; i<response.count; i++) {
        if (response.matches[i].competition.name === "Premier League") {
          teamMatches.push(response.matches[i]);
        }
      }
      console.log(teamMatches);
    });
  });
}

$(getTeamMatchesData);
