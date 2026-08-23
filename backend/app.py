"""
UtilityWatch — Flask Application Entry Point
============================================
Registers Blueprints, configures CORS, loads environment variables.
"""

import os
import sys

# Ensure local packages resolve correctly
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load .env before anything else
load_dotenv()

from routes.data_routes import data_bp
from routes.analytics_routes import analytics_bp
from routes.ai_routes import ai_bp


def create_app() -> Flask:
    app = Flask(__name__)

    # Allow cross-origin requests from the Vite dev server and any local origin
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register blueprints
    app.register_blueprint(data_bp, url_prefix="/api")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")
    app.register_blueprint(ai_bp, url_prefix="/api/ai")

    # Global error handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Endpoint not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"error": "Method not allowed"}), 405

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"error": "Internal server error"}), 500

    return app


if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "true").lower() == "true"
    print(f"UtilityWatch API starting on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=debug)
