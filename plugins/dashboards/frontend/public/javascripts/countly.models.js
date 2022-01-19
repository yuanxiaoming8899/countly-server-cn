/*global jQuery, countlyCommon, CV, countlyVue, _ */

(function(countlyDashboards) {

    countlyDashboards.factory = {
        dashboards: {
            getEmpty: function() {
                return {
                    name: "",
                    shared_email_edit: [],
                    shared_email_view: [],
                    shared_user_groups_edit: [],
                    shared_user_groups_view: [],
                    share_with: "all-users",
                    theme: 0
                };
            }
        }
    };

    countlyDashboards.service = {
        dashboards: {
            getAll: function() {
                return CV.$.ajax({
                    type: "GET",
                    url: countlyCommon.API_PARTS.data.r + "/dashboards/all",
                    data: {},
                    dataType: "json"
                });
            },
            get: function(dashboardId, isRefresh) {
                return CV.$.ajax({
                    type: "GET",
                    url: countlyCommon.API_PARTS.data.r + "/dashboards",
                    data: {
                        "dashboard_id": dashboardId,
                        "period": countlyCommon.getPeriodForAjax(),
                        "action": (isRefresh) ? "refresh" : ""
                    },
                    dataType: "json",
                });
            },
            create: function(settings) {
                return CV.$.ajax({
                    type: "GET",
                    url: countlyCommon.API_PARTS.data.w + "/dashboards/create",
                    data: {
                        "name": settings.name,
                        "shared_email_edit": JSON.stringify(settings.shared_email_edit) || [],
                        "shared_email_view": JSON.stringify(settings.shared_email_view) || [],
                        "shared_user_groups_edit": JSON.stringify(settings.shared_user_groups_edit) || [],
                        "shared_user_groups_view": JSON.stringify(settings.shared_user_groups_view) || [],
                        "copy_dash_id": settings.copyDashId,
                        "share_with": settings.share_with,
                        "theme": settings.theme
                    },
                    dataType: "json"
                });
            },
            update: function(dashboardId, settings) {
                return CV.$.ajax({
                    type: "GET",
                    url: countlyCommon.API_PARTS.data.w + "/dashboards/update",
                    data: {
                        "dashboard_id": dashboardId,
                        "name": settings.name,
                        "shared_email_edit": JSON.stringify(settings.shared_email_edit),
                        "shared_email_view": JSON.stringify(settings.shared_email_view),
                        "shared_user_groups_edit": JSON.stringify(settings.shared_user_groups_edit),
                        "shared_user_groups_view": JSON.stringify(settings.shared_user_groups_view),
                        "share_with": settings.share_with,
                        "theme": settings.theme
                    },
                    dataType: "json"
                });
            },
            delete: function(dashboardId) {
                return CV.$.ajax({
                    type: "GET",
                    url: countlyCommon.API_PARTS.data.w + "/dashboards/delete",
                    data: {
                        "dashboard_id": dashboardId
                    },
                    dataType: "json"
                });
            }
        },
        widgets: {
            get: function(dashboardId, widgetId) {
                return CV.$.ajax({
                    type: "GET",
                    url: countlyCommon.API_PARTS.data.r + "/dashboards/widget",
                    data: {
                        "period": countlyCommon.getPeriodForAjax(),
                        "dashboard_id": dashboardId,
                        "widget_id": widgetId
                    }
                });
            },
            create: function(dashboardId, widget) {
                return CV.$.ajax({
                    type: "GET",
                    url: countlyCommon.API_PARTS.data.w + "/dashboards/add-widget",
                    data: {
                        "dashboard_id": dashboardId,
                        "widget": JSON.stringify(widget)
                    },
                    dataType: "json",
                }, {disableAutoCatch: true}).then(function(res) {
                    return res;
                }).catch(function(err) {
                    console.log(err);
                });
            },
            update: function(dashboardId, widgetId, widget) {
                return CV.$.ajax({
                    type: "GET",
                    url: countlyCommon.API_PARTS.data.w + "/dashboards/update-widget",
                    data: {
                        "dashboard_id": dashboardId,
                        "widget_id": widgetId,
                        "widget": JSON.stringify(widget)
                    },
                });
            },
            delete: function(dashboardId, widgetId) {
                return CV.$.ajax({
                    type: "GET",
                    url: countlyCommon.API_PARTS.data.w + "/dashboards/remove-widget",
                    data: {
                        "dashboard_id": dashboardId,
                        "widget_id": widgetId
                    },
                    dataType: "json"
                });
            }
        }
    };

    countlyDashboards.getVuexModule = function() {
        var widgetsResource = countlyVue.vuex.Module("widgets", {
            state: function() {
                return {
                    all: []
                };
            },
            getters: {
                all: function(state) {
                    return state.all;
                }
            },
            mutations: {
                setAll: function(state, widgets) {
                    state.all = widgets;
                },
                update: function(state, widget) {
                    var index = -1;
                    widget = widget || {};

                    for (var i = 0; i < state.all.length; i++) {
                        if (state.all[i]._id === widget._id) {
                            index = i;
                            break;
                        }
                    }

                    if (index > -1) {
                        state.all.splice(index, 1, widget);
                    }
                    else if (widget._id) {
                        state.all.push(widget);
                    }
                },
                remove: function(state, widgetId) {
                    var index = -1;

                    for (var i = 0; i < state.all.length; i++) {
                        if (state.all[i]._id === widgetId) {
                            index = i;
                            break;
                        }
                    }

                    if (index > -1) {
                        state.all.splice(index, 1);
                    }
                }
            },
            actions: {
                setAll: function(context, widgets) {
                    context.commit("setAll", widgets);
                },
                get: function(context, widgetId) {
                    var dashboardId = context.rootGetters["countlyDashboards/selected"].id;

                    return countlyDashboards.service.widgets.get(dashboardId, widgetId).then(function(w) {
                        /*
                            Update the widget in the widget store.
                        */
                        context.commit("update", w && w[0]);
                    });
                },
                create: function(context, widget) {
                    var dashboardId = context.rootGetters["countlyDashboards/selected"].id;
                    var settings = widget.settings || {};

                    return countlyDashboards.service.widgets.create(dashboardId, settings);
                },
                update: function(context, widget) {
                    var dashboardId = context.rootGetters["countlyDashboards/selected"].id;
                    var widgetId = widget.id;
                    var settings = widget.settings;

                    return countlyDashboards.service.widgets.update(dashboardId, widgetId, settings);
                },
                delete: function(context, widgetId) {
                    var dashboardId = context.rootGetters["countlyDashboards/selected"].id;

                    return countlyDashboards.service.widgets.delete(dashboardId, widgetId).then(function() {
                        context.commit("remove", widgetId);
                    });
                }
            }
        });

        var getEmptyState = function() {
            return {
                all: [],
                selected: {
                    id: null,
                    data: null
                }
            };
        };

        var getters = {
            all: function(state) {
                return _.sortBy(state.all, "name");
            },
            selected: function(state) {
                return state.selected;
            },
            reportDateRangeDict: function() {
                return {
                    daily: [
                        {name: jQuery.i18n.map["common.yesterday"], value: "yesterday"},
                        {name: jQuery.i18n.map["common.7days"], value: "7days"},
                        {name: jQuery.i18n.map["common.30days"], value: "30days"},
                        {name: jQuery.i18n.map["common.60days"], value: "60days"}
                    ],
                    weekly: [
                        {name: jQuery.i18n.map["common.7days"], value: "7days"},
                        {name: jQuery.i18n.map["common.30days"], value: "30days"},
                        {name: jQuery.i18n.map["common.60days"], value: "60days"}
                    ],
                    monthly: [
                        {name: jQuery.i18n.map["common.30days"], value: "30days"},
                        {name: jQuery.i18n.map["common.60days"], value: "60days"}
                    ]
                };
            }
        };

        var mutations = {
            setAll: function(state, dashboards) {
                state.all = dashboards;
            },
            setSelectedDashboard: function(state, dashboard) {
                state.selected = {
                    id: dashboard.id,
                    data: dashboard.data
                };
            },
            updateDashboard: function(state, dashboard) {
                var index = -1;
                for (var i = 0; i < state.all.length; i++) {
                    if (state.all[i]._id === dashboard._id) {
                        index = i;
                        break;
                    }
                }

                if (index > -1) {
                    state.all.splice(index, 1, dashboard);
                }
                else {
                    state.all.push(dashboard);
                }
            }
        };

        var actions = {
            /*
                Public actions
            */
            getAll: function(context) {
                return countlyDashboards.service.dashboards.getAll().then(function(res) {
                    var dashboards = res || [];
                    context.dispatch("setAll", dashboards);
                });
            },
            getDashboard: function(context, params) {
                var dashboardId = context.getters.selected.id;

                countlyDashboards.service.dashboards.get(dashboardId, params && params.isRefresh).then(function(res) {
                    var dashbaord = null;
                    var widgets = [];
                    var dId = null;

                    if (res && res._id) {
                        dId = res._id;

                        if (dId === dashboardId) {
                            dashbaord = res;
                            widgets = dashbaord.widgets || [];
                        }
                        else {
                            dId = null;
                        }
                    }

                    /*
                        On getting the dashboard, Set the selected dashboard data
                        as well as update the local list of all dashboards.
                    */

                    context.commit("setSelectedDashboard", {id: dId, data: dashbaord});

                    if (dashbaord) {
                        context.commit("updateDashboard", dashbaord);
                    }

                    /*
                        Set all widgets of this dashboard here in the vuex store - Start
                    */
                    context.dispatch("widgets/setAll", widgets);
                    /*
                        Set all widgets of this dashboard here in the vuex store - End
                    */

                    return dashbaord;
                });
            },
            setDashboard: function(context, params) {
                /**
                 * params will null when dashbaord is deleted
                 * params will also be null there are no dashboards
                 * {
                 *     id: "",
                 *     isRefresh: false
                 * }
                 */

                params = params || {};

                var dashboardId = params.id;

                var dash = context.getters.all.find(function(dashboard) {
                    return dashboard._id === dashboardId;
                });

                var widgets = dash && dash.widgets || [];

                context.commit("setSelectedDashboard", {id: dashboardId, data: dash});

                /*
                    Set all widgets of this dashboard here in the vuex store - Start
                */
                context.dispatch("widgets/setAll", widgets);
                /*
                    Set all widgets of this dashboard here in the vuex store - End
                */

                /*
                    We have already set the current dashboard and its widget data in the vuex store
                    But we will update it again after we have the updated data from the server
                    Until the request is processing, we will show the loading states for the widgets if no data is available
                */

                if (dashboardId) {
                    context.dispatch("getDashboard", params);
                }
            },

            /*
                Private actions
            */
            setAll: function(context, dashboards) {
                context.commit("setAll", dashboards);
            },
            create: function(context, settings) {
                return countlyDashboards.service.dashboards.create(settings).then(function(id) {
                    /*
                        Dispatching getAll so that the list of dashboards in the sidebar gets updated.
                        This is required because we navigate the new dashboard after creating it.
                        And when we navigate, the sidebar component is not remounted as its already mounted.
                        Basically its out of the backbone render view.
                        However, the sidebar will react to the all getter whenever all state changes.

                        We could have also dispatched the setDashboard action here itself, but then
                        the url would not be updated in the browser. To update that we navigate the new url
                        resolved promise and that inturn sets the dashboard data automatically.
                    */

                    return context.dispatch("getAll").then(function() {
                        return id;
                    });
                });
            },
            update: function(context, settings) {
                var dashboardId = context.getters.selected.id;

                return countlyDashboards.service.dashboards.update(dashboardId, settings).then(function() {
                    context.dispatch("getDashboard");
                });
            },
            duplicate: function(context, settings) {
                settings.copyDashId = context.getters.selected.id;
                return context.dispatch("create", settings);
            },
            delete: function(context, id) {
                return countlyDashboards.service.dashboards.delete(id).then(function() {
                    context.dispatch("getAll").then(function() {
                        context.dispatch("setDashboard");
                    });
                });
            }
        };

        return countlyVue.vuex.Module("countlyDashboards", {
            state: getEmptyState,
            getters: getters,
            mutations: mutations,
            actions: actions,
            submodules: [widgetsResource],
            destroy: false
        });
    };

})(window.countlyDashboards = window.countlyDashboards || {});
