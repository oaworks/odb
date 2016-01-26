
from flask import Flask, request, abort, render_template, make_response, redirect, flash
from flask.views import View
from flask.ext.login import login_user, current_user

import json

import portality.models as models
import portality.util as util
from portality.core import app, login_manager

from portality.view.query import blueprint as query
from portality.view.stream import blueprint as stream
from portality.view.account import blueprint as account
from portality.view.api import blueprint as api
from portality.view.media import blueprint as media
from portality.view.pagemanager import blueprint as pagemanager


app.register_blueprint(query, url_prefix='/query')
app.register_blueprint(stream, url_prefix='/stream')
app.register_blueprint(account, url_prefix='/account')
app.register_blueprint(api, url_prefix='/api')
app.register_blueprint(media, url_prefix='/media')
app.register_blueprint(pagemanager)


@login_manager.user_loader
def load_account_for_login_manager(userid):
    out = models.Account.pull(userid)
    return out

@app.context_processor
def set_current_context():
    """ Set some template context globals. """
    return dict(current_user=current_user, app=app)

@app.before_request
def standard_authentication():
    """Check remote_user on a per-request basis."""
    remote_user = request.headers.get('REMOTE_USER', '')
    try:
        api_key = request.json['api_key']
    except:
        try:
            api_key = request.values['api_key']
        except:
            api_key = False
    if remote_user:
        user = models.Account.pull(remote_user)
        if user is not None:
            login_user(user, remember=False)
    # add a check for provision of api key
    elif 'api_key':
        res = models.Account.query(q='api_key:"' + api_key + '"')['hits']['hits']
        if len(res) == 1:
            user = models.Account.pull(res[0]['_source']['id'])
            if user is not None:
                login_user(user, remember=False)


@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

@app.errorhandler(401)
def unauthorised(e):
    return render_template('401.html'), 401
        

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/download")
def dlredir():
    return redirect('/#download')


@app.route("/wishlist")
def wishlist():
    try:
        if request.json:
            vals = request.json
        else:
            vals = request.values
        resp = make_response(json.dumps( current_user.wishlist(**vals) ))
        resp.mimetype = "application/json"
        return resp
    except:
        abort(404)

@app.route("/blocked")
def blocked():
    try:
        if request.json:
            vals = request.json
        else:
            vals = request.values
        resp = make_response(json.dumps( current_user.blocked(**vals) ))
        resp.mimetype = "application/json"
        return resp
    except:
        abort(404)


if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=app.config['DEBUG'], port=app.config['PORT'])

