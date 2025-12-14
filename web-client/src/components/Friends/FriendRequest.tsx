import React from 'react';
import { useChat } from '../../hooks/useChat';

export const FriendRequest: React.FC = () => {
  const { pendingRequests, acceptFriendRequest, rejectFriendRequest } = useChat();

  if (pendingRequests.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase px-3">
        Friend Requests ({pendingRequests.length})
      </h3>

      <div className="space-y-2">
        {pendingRequests.map((request) => (
          <div
            key={request.requestId}
            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-2"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                {request.fromUsername.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  {request.fromUsername}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Wants to be your friend
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => acceptFriendRequest(request.requestId)}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2 px-3 rounded transition-colors"
              >
                Accept
              </button>
              <button
                onClick={() => rejectFriendRequest(request.requestId)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2 px-3 rounded transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
